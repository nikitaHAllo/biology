import { Request, Response } from 'express';
import {
	User,
	WalletTransaction,
	UserProgress,
	UserAchievement,
	Achievement,
	Lesson,
	Course,
} from '../../models';

export class UsersController {
	// Получить профиль пользователя
	async getProfile(req: Request, res: Response) {
		try {
			const { telegramId } = req.params;

			const user = (await User.findOne({
				where: { telegram_id: telegramId },
				attributes: ['id', 'telegram_id', 'username', 'coins', 'created_at'],
				include: [
					{
						model: UserProgress,
						as: 'progress',
						include: [
							{
								model: Lesson,
								as: 'lesson',
								attributes: ['id', 'title', 'course_id'],
								include: [
									{
										model: Course,
										as: 'course',
										attributes: ['id', 'title'],
									},
								],
							},
						],
					},
					{
						model: UserAchievement,
						as: 'achievements',
						include: [
							{
								model: Achievement,
								as: 'achievement',
								attributes: ['id', 'code', 'title', 'description'],
							},
						],
					},
				],
			})) as any;

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			// Используем dataValues для доступа к данным
			const userData = user.dataValues;
			const userProgress = userData.progress || [];
			const userAchievements = userData.achievements || [];

			// Статистика прогресса
			const completedLessons = userProgress.filter(
				(p: any) => p.status === 'completed'
			).length;
			const inProgressLessons = userProgress.filter(
				(p: any) => p.status === 'in_progress'
			).length;

			res.json({
				success: true,
				data: {
					profile: {
						id: userData.id,
						telegram_id: userData.telegram_id,
						username: userData.username,
						coins: userData.coins,
						created_at: userData.created_at,
					},
					statistics: {
						completed_lessons: completedLessons,
						in_progress_lessons: inProgressLessons,
						total_achievements: userAchievements.length,
						total_coins: userData.coins,
					},
					progress: userProgress.map((p: any) => ({
						lesson_id: p.lesson_id,
						lesson_title: p.lesson?.title,
						course_title: p.lesson?.course?.title,
						status: p.status,
						updated_at: p.updated_at,
					})),
					achievements: userAchievements.map((a: any) => ({
						code: a.achievement?.code,
						title: a.achievement?.title,
						description: a.achievement?.description,
						awarded_at: a.awarded_at,
					})),
				},
			});
		} catch (error) {
			console.error('Error fetching user profile:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении профиля',
			});
		}
	}

	// Получить историю транзакций
	async getTransactionHistory(req: Request, res: Response) {
		try {
			const { telegramId } = req.params;
			const { limit = 20, offset = 0 } = req.query;

			const user = await User.findOne({
				where: { telegram_id: telegramId },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const transactions = await WalletTransaction.findAll({
				where: { user_id: user.get('id') },
				order: [['created_at', 'DESC']],
				limit: Number(limit),
				offset: Number(offset),
			});

			const total = await WalletTransaction.count({
				where: { user_id: user.get('id') },
			});

			res.json({
				success: true,
				data: {
					transactions: transactions.map(t => ({
						id: t.get('id'),
						type: t.get('type'),
						amount: t.get('amount'),
						source: t.get('source'),
						meta: t.get('meta'),
						created_at: t.get('created_at'),
					})),
					pagination: {
						total,
						limit: Number(limit),
						offset: Number(offset),
						has_more: Number(offset) + transactions.length < total,
					},
				},
			});
		} catch (error) {
			console.error('Error fetching transaction history:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении истории транзакций',
			});
		}
	}

	// Получить прогресс пользователя по курсам
	async getCourseProgress(req: Request, res: Response) {
		try {
			const { telegramId } = req.params;

			const user = (await User.findOne({
				where: { telegram_id: telegramId },
				include: [
					{
						model: UserProgress,
						as: 'progress',
						include: [
							{
								model: Lesson,
								as: 'lesson',
								attributes: ['id', 'title', 'course_id'],
								include: [
									{
										model: Course,
										as: 'course',
										attributes: ['id', 'title', 'description'],
									},
								],
							},
						],
					},
				],
			})) as any;

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const userData = user.dataValues;
			const userProgress = userData.progress || [];

			// Группируем прогресс по курсам
			const courseProgress = userProgress.reduce((acc: any, progress: any) => {
				const courseId = progress.lesson?.course_id;
				if (!courseId) return acc;

				if (!acc[courseId]) {
					acc[courseId] = {
						course_id: courseId,
						course_title: progress.lesson?.course?.title,
						course_description: progress.lesson?.course?.description,
						total_lessons: 0,
						completed_lessons: 0,
						in_progress_lessons: 0,
						progress_percentage: 0,
						lessons: [],
					};
				}

				acc[courseId].lessons.push({
					lesson_id: progress.lesson_id,
					lesson_title: progress.lesson?.title,
					status: progress.status,
					updated_at: progress.updated_at,
				});

				if (progress.status === 'completed') {
					acc[courseId].completed_lessons++;
				} else if (progress.status === 'in_progress') {
					acc[courseId].in_progress_lessons++;
				}

				acc[courseId].total_lessons = acc[courseId].lessons.length;

				if (acc[courseId].total_lessons > 0) {
					acc[courseId].progress_percentage = Math.round(
						(acc[courseId].completed_lessons / acc[courseId].total_lessons) *
							100
					);
				} else {
					acc[courseId].progress_percentage = 0;
				}

				return acc;
			}, {});

			res.json({
				success: true,
				data: {
					courses: Object.values(courseProgress),
				},
			});
		} catch (error) {
			console.error('Error fetching course progress:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении прогресса по курсам',
			});
		}
	}

	// Обновить профиль пользователя
	async updateProfile(req: Request, res: Response) {
		try {
			const { telegramId } = req.params;
			const { username } = req.body;

			const user = await User.findOne({
				where: { telegram_id: telegramId },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			await user.update({ username });

			res.json({
				success: true,
				message: 'Профиль успешно обновлен',
				data: {
					telegram_id: user.get('telegram_id'),
					username: user.get('username'),
					coins: user.get('coins'),
				},
			});
		} catch (error) {
			console.error('Error updating user profile:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при обновлении профиля',
			});
		}
	}

	// Получить достижения пользователя
	// Получить достижения пользователя (исправленная версия)
	async getAchievements(req: Request, res: Response) {
		try {
			const { telegramId } = req.params;

			// Сначала находим пользователя
			const user = await User.findOne({
				where: { telegram_id: telegramId },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			// Получаем достижения пользователя
			const userAchievements = await UserAchievement.findAll({
				where: { user_id: user.get('id') },
				attributes: ['achievement_id', 'awarded_at'],
				include: [
					{
						model: Achievement,
						as: 'achievement',
						attributes: ['id', 'code', 'title', 'description'], // Только нужные поля
					},
				],
			});

			// Получаем все доступные достижения
			const allAchievements = await Achievement.findAll({
				attributes: ['id', 'code', 'title', 'description'],
			});

			// Создаем Map достижений пользователя
			const userAchievementsMap = new Map(
				userAchievements.map((ua: any) => [
					ua.achievement_id,
					ua.get({ plain: true }),
				])
			);

			// Формируем ответ
			const achievements = allAchievements.map(achievement => {
				const achievementData = achievement.get({ plain: true });
				const userAchievement = userAchievementsMap.get(achievementData.id);

				return {
					id: achievementData.id,
					code: achievementData.code,
					title: achievementData.title,
					description: achievementData.description,
					achieved: !!userAchievement,
					awarded_at: userAchievement?.awarded_at || null,
				};
			});

			res.json({
				success: true,
				data: {
					achievements,
					summary: {
						total: allAchievements.length,
						achieved: userAchievements.length,
						progress_percentage:
							allAchievements.length > 0
								? Math.round(
										(userAchievements.length / allAchievements.length) * 100
								  )
								: 0,
					},
				},
			});
		} catch (error) {
			console.error('Error fetching user achievements:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении достижений',
			});
		}
	}

	// Получить баланс пользователя
	async getBalance(req: Request, res: Response) {
		try {
			const { telegramId } = req.params;

			const user = await User.findOne({
				where: { telegram_id: telegramId },
				attributes: ['id', 'telegram_id', 'username', 'coins'],
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			res.json({
				success: true,
				data: {
					telegram_id: user.get('telegram_id'),
					username: user.get('username'),
					coins: user.get('coins'),
				},
			});
		} catch (error) {
			console.error('Error fetching user balance:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении баланса',
			});
		}
	}

	// Получить краткую статистику пользователя
	async getStats(req: Request, res: Response) {
		try {
			const { telegramId } = req.params;

			const user = (await User.findOne({
				where: { telegram_id: telegramId },
				attributes: ['id', 'telegram_id', 'username', 'coins', 'created_at'],
				include: [
					{
						model: UserProgress,
						as: 'progress',
						attributes: ['status'],
					},
					{
						model: UserAchievement,
						as: 'achievements',
						attributes: ['id'],
					},
				],
			})) as any;

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const userData = user.dataValues;
			const userProgress = userData.progress || [];
			const userAchievements = userData.achievements || [];

			const completedLessons = userProgress.filter(
				(p: any) => p.status === 'completed'
			).length;
			const totalLessons = userProgress.length;

			res.json({
				success: true,
				data: {
					profile: {
						telegram_id: userData.telegram_id,
						username: userData.username,
						coins: userData.coins,
						member_since: userData.created_at,
					},
					stats: {
						total_lessons: totalLessons,
						completed_lessons: completedLessons,
						completion_rate:
							totalLessons > 0
								? Math.round((completedLessons / totalLessons) * 100)
								: 0,
						total_achievements: userAchievements.length,
						total_coins: userData.coins,
					},
				},
			});
		} catch (error) {
			console.error('Error fetching user stats:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении статистики',
			});
		}
	}
}

export const usersController = new UsersController();
