import { Request, Response } from 'express';
import {
	User,
	WalletTransaction,
	UserProgress,
	UserAchievement,
	Achievement,
	Lesson,
	Course,
	UserMaterialAccess,
	MaterialTopic,
	MaterialSection,
	Quiz,
} from '../../models';

interface UserProgressWithLesson {
	lesson_id: number;
	status: 'pending' | 'in_progress' | 'completed';
	updated_at: Date;
	lesson?: {
		id: number;
		title: string;
		course_id: number;
		course?: {
			id: number;
			title: string;
			description?: string | null;
		};
	};
}

interface UserAchievementWithAchievement {
	achievement_id: number;
	awarded_at: Date;
	achievement?: {
		id: number;
		code: string;
		title: string;
		description: string | null;
	};
}

interface UserMaterialAccessWithTopic {
	topic_id: number;
	purchased_at: Date;
	topic?: {
		id: number;
		title: string;
		section?: {
			id: number;
			title: string;
		} | null;
	};
}

interface UserWithAssociations {
	id: number;
	telegram_id: number | null;
	username: string | null;
	coins: number;
	created_at: Date;
	progress?: UserProgressWithLesson[];
	achievements?: UserAchievementWithAchievement[];
	materialAccesses?: UserMaterialAccessWithTopic[];
}

type ProfileProgressEntry = {
	lesson_id: number;
	lesson_title?: string | null;
	course_title?: string | null;
	status: 'pending' | 'in_progress' | 'completed';
	updated_at: Date;
};

const USER_PROFILE_INCLUDE = [
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
	{
		model: UserMaterialAccess,
		as: 'materialAccesses',
		include: [
			{
				model: MaterialTopic,
				as: 'topic',
				include: [
					{
						model: MaterialSection,
						as: 'section',
					},
				],
			},
		],
	},
];

const COURSE_PROGRESS_INCLUDE = [
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
];

function buildCourseProgressJson(user: User) {
	const userData = user.get({ plain: true }) as UserWithAssociations;
	const userProgress = userData.progress || [];

	const courseProgress = userProgress.reduce(
		(
			acc: Record<
				number,
				{
					course_id: number;
					course_title?: string | undefined;
					course_description?: string | null | undefined;
					total_lessons: number;
					completed_lessons: number;
					in_progress_lessons: number;
					progress_percentage: number;
					lessons: Array<{
						lesson_id: number;
						lesson_title?: string;
						status: 'pending' | 'in_progress' | 'completed';
						updated_at: Date;
					}>;
				}
			>,
			progress: UserProgressWithLesson
		) => {
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

			const lessonData = {
				lesson_id: progress.lesson_id,
				...(progress.lesson?.title && {
					lesson_title: progress.lesson.title,
				}),
				status: progress.status,
				updated_at: progress.updated_at,
			};
			acc[courseId].lessons.push(lessonData);

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
		},
		{}
	);

	return {
		success: true,
		data: {
			courses: Object.values(courseProgress),
		},
	};
}

async function buildAchievementsJson(userId: number) {
	const userAchievements = await UserAchievement.findAll({
		where: { user_id: userId },
		attributes: ['achievement_id', 'awarded_at'],
		include: [
			{
				model: Achievement,
				as: 'achievement',
				attributes: ['id', 'code', 'title', 'description'],
			},
		],
	});

	const allAchievements = await Achievement.findAll({
		attributes: ['id', 'code', 'title', 'description'],
	});

	const userAchievementsMap = new Map(
		userAchievements.map(ua => [
			ua.get('achievement_id'),
			ua.get({ plain: true }),
		])
	);

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

	return {
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
	};
}

async function buildStatsJson(user: User) {
	const userData = user.get({ plain: true }) as UserWithAssociations;
	const userProgress = userData.progress || [];
	const userAchievements = userData.achievements || [];
	const totalQuizzes = await Quiz.count();
	const completedLessons = userProgress.filter(
		p => p.status === 'completed'
	).length;

	return {
		success: true,
		data: {
			profile: {
				telegram_id: userData.telegram_id,
				username: userData.username,
				coins: userData.coins,
				member_since: userData.created_at,
			},
			stats: {
				total_lessons: totalQuizzes,
				completed_lessons: completedLessons,
				completion_rate:
					totalQuizzes > 0
						? Math.round((completedLessons / totalQuizzes) * 100)
						: 0,
				total_achievements: userAchievements.length,
				total_coins: userData.coins,
			},
		},
	};
}

function formatProfilePayload(userData: UserWithAssociations) {
	const userProgress = userData.progress || [];
	const materialAccesses = userData.materialAccesses || [];

	const catalogProgress: ProfileProgressEntry[] = materialAccesses
		.filter(access => access.topic)
		.map(access => ({
			lesson_id: access.topic_id,
			lesson_title: access.topic?.title ?? null,
			course_title: access.topic?.section?.title ?? null,
			status: 'completed' as const,
			updated_at: access.purchased_at,
		}));

	const lessonProgressMapped: ProfileProgressEntry[] = userProgress.map(
		p => ({
			lesson_id: p.lesson_id,
			lesson_title: p.lesson?.title ?? null,
			course_title: p.lesson?.course?.title ?? null,
			status: p.status,
			updated_at: p.updated_at,
		})
	);

	const combinedProgress: ProfileProgressEntry[] = [
		...catalogProgress,
		...lessonProgressMapped,
	];
	const userAchievements = userData.achievements || [];

	const completedLessons = combinedProgress.filter(
		p => p.status === 'completed'
	).length;
	const inProgressLessons = combinedProgress.filter(
		p => p.status === 'in_progress'
	).length;

	return {
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
			progress: combinedProgress.map(p => ({
				lesson_id: p.lesson_id,
				lesson_title: p.lesson_title,
				course_title: p.course_title,
				status: p.status,
				updated_at: p.updated_at,
			})),
			achievements: userAchievements.map(a => ({
				code: a.achievement?.code,
				title: a.achievement?.title,
				description: a.achievement?.description,
				awarded_at: a.awarded_at,
			})),
		},
	};
}

export class UsersController {
	// Получить профиль пользователя
	async getProfile(req: Request, res: Response) {
		try {
			const { telegramId } = req.params;

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
				attributes: ['id', 'telegram_id', 'username', 'coins', 'created_at'],
				include: USER_PROFILE_INCLUDE,
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const userData = user.get({ plain: true }) as UserWithAssociations;
			res.json(formatProfilePayload(userData));
		} catch (error) {
			console.error('Error fetching user profile:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении профиля',
			});
		}
	}

	async getProfileMe(req: Request, res: Response) {
		try {
			const user = await User.findByPk(req.user!.id, {
				attributes: ['id', 'telegram_id', 'username', 'coins', 'created_at'],
				include: USER_PROFILE_INCLUDE,
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const userData = user.get({ plain: true }) as UserWithAssociations;
			res.json(formatProfilePayload(userData));
		} catch (error) {
			console.error('Error fetching user profile (me):', error);
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
				where: { telegram_id: Number(telegramId) },
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

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
				include: COURSE_PROGRESS_INCLUDE,
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			res.json(buildCourseProgressJson(user));
		} catch (error) {
			console.error('Error fetching course progress:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении прогресса по курсам',
			});
		}
	}

	async getCourseProgressMe(req: Request, res: Response) {
		try {
			const user = await User.findByPk(req.user!.id, {
				include: COURSE_PROGRESS_INCLUDE,
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			res.json(buildCourseProgressJson(user));
		} catch (error) {
			console.error('Error fetching course progress (me):', error);
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
				where: { telegram_id: Number(telegramId) },
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

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const payload = await buildAchievementsJson(user.get('id') as number);
			res.json(payload);
		} catch (error) {
			console.error('Error fetching user achievements:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении достижений',
			});
		}
	}

	async getAchievementsMe(req: Request, res: Response) {
		try {
			const payload = await buildAchievementsJson(req.user!.id);
			res.json(payload);
		} catch (error) {
			console.error('Error fetching user achievements (me):', error);
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
				where: { telegram_id: Number(telegramId) },
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

	async getBalanceMe(req: Request, res: Response) {
		try {
			const user = await User.findByPk(req.user!.id, {
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
			console.error('Error fetching user balance (me):', error);
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

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
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
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			res.json(await buildStatsJson(user));
		} catch (error) {
			console.error('Error fetching user stats:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении статистики',
			});
		}
	}

	async getStatsMe(req: Request, res: Response) {
		try {
			const user = await User.findByPk(req.user!.id, {
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
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			res.json(await buildStatsJson(user));
		} catch (error) {
			console.error('Error fetching user stats (me):', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении статистики',
			});
		}
	}

	async updateProfileMe(req: Request, res: Response) {
		try {
			const user = req.user!;
			const { username } = req.body;

			await user.update({ username });

			res.json({
				success: true,
				message: 'Профиль успешно обновлен',
				data: {
					telegram_id: user.telegram_id,
					username: user.username,
					coins: user.coins,
				},
			});
		} catch (error) {
			console.error('Error updating user profile (me):', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при обновлении профиля',
			});
		}
	}
}

export const usersController = new UsersController();
