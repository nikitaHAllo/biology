import { Request, Response } from 'express';
import {
	MaterialSection,
	MaterialTopic,
	MaterialFile,
	User,
	UserMaterialAccess,
	WalletTransaction,
} from '../../models';
import { sequelize } from '../../db/sequelize';
import { usersService } from '../../services/users.service';

function toNumber(value: unknown): number | undefined {
	if (value === null || value === undefined) return undefined;
	const num = Number(value);
	return Number.isNaN(num) ? undefined : num;
}

class MaterialsController {
	async getCatalog(req: Request, res: Response) {
		try {
			const telegramIdRaw = req.query.telegramId as string | undefined;
			const telegramId = telegramIdRaw ? Number(telegramIdRaw) : undefined;
			let userAccessMap = new Map<number, boolean>();

			let userId: number | null = null;
			if (telegramId) {
				const user = await User.findOne({
					where: { telegram_id: telegramId },
				});
				if (user) {
					userId = Number(user.get('id'));
					if (userId) {
						const accesses = await UserMaterialAccess.findAll({
							where: { user_id: userId },
						});
						userAccessMap = new Map(
							accesses.map(access => [access.topic_id, true])
						);
					}
				}
			}

			const sections = await MaterialSection.findAll({
				order: [['order_index', 'ASC']],
				include: [
					{
						model: MaterialTopic,
						as: 'topics',
						include: [
							{
								model: MaterialFile,
								as: 'files',
							},
						],
					},
				],
			});

			const formatted = sections.map(section => {
				const sectionPlain = section.get({ plain: true }) as MaterialSection & {
					topics?: Array<
						MaterialTopic & {
							files?: MaterialFile[];
						}
					>;
				};

				return {
					id: sectionPlain.id,
					title: sectionPlain.title,
					slug: sectionPlain.slug,
					description: sectionPlain.description,
					icon: sectionPlain.icon,
					order: sectionPlain.order_index,
					topics: (sectionPlain.topics || [])
						.sort((a, b) => a.order_index - b.order_index)
						.map(topic => ({
							id: topic.id,
							section_id: topic.section_id,
							title: topic.title,
							slug: topic.slug,
							description: topic.description,
							price_repcoins: topic.price_repcoins,
							order: topic.order_index,
							is_purchased:
								topic.is_default_unlocked ||
								Boolean(userAccessMap.get(topic.id)),
							files: (topic.files || []).map(file => ({
								id: file.id,
								topic_id: file.topic_id,
								name: file.name,
								file_url: file.file_url,
								file_type: file.file_type,
								file_size: toNumber(file.file_size),
								created_at: file.created_at,
							})),
						})),
				};
			});

			res.json({
				success: true,
				data: {
					sections: formatted,
				},
			});
		} catch (error) {
			console.error('Error fetching materials catalog:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось загрузить каталог материалов',
			});
		}
	}

	async purchaseTopic(req: Request, res: Response) {
		try {
			const { topicId } = req.params;
			const { telegramId } = req.body as { telegramId?: unknown };

			// Validate topicId
			const topicIdNum = Number(topicId);
			if (!Number.isInteger(topicIdNum) || topicIdNum <= 0) {
				return res.status(400).json({
					success: false,
					message: 'Некорректный topicId',
				});
			}

			// Validate telegramId
			const tgIdNum = Number(telegramId);
			if (!Number.isInteger(tgIdNum) || tgIdNum <= 0) {
				return res.status(400).json({
					success: false,
					message: 'Некорректный telegramId пользователя',
				});
			}

			let user = await User.findOne({
				where: { telegram_id: tgIdNum },
				raw: true,
			});

			if (!user) {
				// Автоматическая регистрация пользователя, если он ещё не создан
				user = await usersService.registerOrUpdateUser(tgIdNum);
			}

			const topic = await MaterialTopic.findByPk(topicIdNum, {
				include: [{ model: MaterialSection, as: 'section' }],
				raw: true,
			});

			if (!topic) {
				return res.status(404).json({
					success: false,
					message: 'Тема не найдена',
				});
			}

			const userId = Number(user.id);
			if (!Number.isInteger(userId) || userId <= 0) {
				return res.status(400).json({
					success: false,
					message: 'Некорректный профиль пользователя',
				});
			}

			const topicIdSafe = Number(topic.id);
			if (!Number.isInteger(topicIdSafe) || topicIdSafe <= 0) {
				return res.status(404).json({
					success: false,
					message: 'Тема не найдена',
				});
			}

			const existingAccess = await UserMaterialAccess.findOne({
				where: { user_id: userId, topic_id: topicIdSafe },
			});

			if (existingAccess) {
				return res.json({
					success: true,
					data: {
						topic_id: topicIdSafe,
						remaining_coins: user.coins,
						already_owned: true,
					},
				});
			}
			if (topic.is_default_unlocked) {
				// Создаем запись о доступе без списания монет
				const access = await UserMaterialAccess.create({
					user_id: user.id,
					topic_id: topicIdNum,
					purchased_at: new Date(),
				});

				return res.json({
					success: true,
					message: 'Тема открыта (бесплатная)',
					data: {
						is_purchased: true,
						topic_id: topicIdNum,
						purchased_at: access.purchased_at,
						new_balance: user.coins,
					},
				});
			}

			// Проверяем баланс пользователя
			const price = Number(topic.price_repcoins);
			const userBalance = Number(user.coins);

			if (userBalance < price) {
				return res.status(400).json({
					success: false,
					message: 'Недостаточно репкоинов',
					data: {
						required: price,
						current: userBalance,
						shortage: price - userBalance,
					},
				});
			}

			// Начинаем транзакцию
			const transaction = await sequelize.transaction();

			try {
				// 1. Списываем монеты с баланса пользователя
				const newBalance = userBalance - price;
				await User.update(
					{ coins: newBalance },
					{
						where: { id: userId },
						transaction,
					}
				);

				// 2. Создаем запись о доступе
				const access = await UserMaterialAccess.create(
					{
						user_id: user.id,
						topic_id: topicIdNum,
						purchased_at: new Date(),
					},
					{ transaction }
				);

				// 3. Создаем транзакцию в кошельке
				await WalletTransaction.create(
					{
						user_id: user.id,
						type: 'debit', // Списание
						amount: price,
						source: 'material_purchase',
						meta: {
							topic_id: topicIdNum,
							topic_title: topic.title,
							price: price,
						},
					},
					{ transaction }
				);

				// 4. Коммитим транзакцию
				await transaction.commit();

				res.json({
					success: true,
					message: 'Тема успешно куплена',
					data: {
						is_purchased: true,
						topic_id: topicIdNum,
						purchased_at: access.purchased_at,
						new_balance: newBalance,
						price_paid: price,
					},
				});
			} catch (transactionError) {
				// Откатываем транзакцию в случае ошибки
				await transaction.rollback();
				throw transactionError;
			}
		} catch (error) {
			console.error('Error purchasing topic:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при покупке темы',
			});
		}
	}

	async checkTopicAccess(req: Request, res: Response) {
		try {
			const { telegramId, topicId } = req.query;

			if (!telegramId || !topicId) {
				return res.status(400).json({
					success: false,
					message: 'Не указаны необходимые параметры',
				});
			}

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
				raw: true,
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const topic = await MaterialTopic.findByPk(Number(topicId));
			if (!topic) {
				return res.status(404).json({
					success: false,
					message: 'Тема не найдена',
				});
			}

			// Проверяем доступ
			const access = await UserMaterialAccess.findOne({
				where: {
					user_id: user.id,
					topic_id: topic.id,
				},
			});

			const hasAccess = !!access || topic.is_default_unlocked;

			res.json({
				success: true,
				data: {
					has_access: hasAccess,
					is_purchased: !!access,
					is_default_unlocked: topic.is_default_unlocked,
					topic_id: topic.id,
					user_id: user.id,
					purchased_at: access?.purchased_at || null,
				},
			});
		} catch (error) {
			console.error('Error checking topic access:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при проверке доступа',
			});
		}
	}
}

export const materialsController = new MaterialsController();
