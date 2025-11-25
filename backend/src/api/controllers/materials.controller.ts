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
					message: 'Некорр��ктный topicId',
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

			const user = await User.findOne({
				where: { telegram_id: tgIdNum },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const topic = await MaterialTopic.findByPk(topicIdNum, {
				include: [{ model: MaterialSection, as: 'section' }],
			});

			if (!topic) {
				return res.status(404).json({
					success: false,
					message: 'Тема не найдена',
				});
			}

			const userId = Number(user.get('id'));
			if (!Number.isInteger(userId) || userId <= 0) {
				return res.status(400).json({
					success: false,
					message: 'Некорректный профиль пользователя',
				});
			}

			const topicIdSafe = Number(topic.id);
			if (!Number.isInteger(topicIdSafe) || topicIdSafe <= 0) {
				return res.status(400).json({
					success: false,
					message: 'Некорректная тема',
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
						remaining_coins: user.get('coins'),
						already_owned: true,
					},
				});
			}

			const price = Number(topic.price_repcoins || 0);

			await sequelize.transaction(async transaction => {
				if (!topic.is_default_unlocked && price > 0) {
					const userCoins = Number(user.get('coins')) || 0;
					if (userCoins < price) {
						throw new Error('Недостаточно средств');
					}

					await user.decrement('coins', {
						by: price,
						transaction,
					});

					await WalletTransaction.create(
						{
							user_id: userId,
							type: 'debit',
							amount: price,
							source: 'material_purchase',
							meta: {
								topic_id: topicIdSafe,
								topic_title: topic.title,
							},
						},
						{ transaction }
					);
				}

				await UserMaterialAccess.create(
					{
						user_id: userId,
						topic_id: topicIdSafe,
					},
					{ transaction }
				);
			});

			await user.reload();

			const topicPlain = topic.get({
				plain: true,
			}) as MaterialTopic & { section?: MaterialSection };

			res.json({
				success: true,
				data: {
					topic_id: topicIdSafe,
					remaining_coins: user.get('coins'),
					section: topicPlain.section?.title,
					title: topicPlain.title,
				},
			});
		} catch (error) {
			if (error instanceof Error && error.message === 'Недостаточно средств') {
				return res.status(400).json({
					success: false,
					message: error.message,
				});
			}
			console.error('Error purchasing topic:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось выполнить покупку темы',
			});
		}
	}
}

export const materialsController = new MaterialsController();


