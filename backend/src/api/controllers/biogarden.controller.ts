// controllers/biogarden.controller.ts
import { Request, Response } from 'express';
import {
	User,
	BioGardenPlant,
	BioGardenQuestion,
	BioGardenAnswerOption,
	UserBioGardenProgress,
	UserBioGardenAttempt,
	WalletTransaction,
	sequelize,
} from '../../models';
import { Op } from 'sequelize';

class BioGardenController {
	// GET /biogarden/plants
	async getPlants(req: Request, res: Response) {
		try {
			const { telegramId } = req.query;

			if (!telegramId) {
				return res.status(400).json({
					success: false,
					message: 'telegramId обязателен',
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

			// Получаем все активные растения
			const plants = await BioGardenPlant.findAll({
				where: { is_active: true },
				order: [['difficulty_level', 'ASC']],
				raw: true,
			});

			// Получаем прогресс пользователя
			const userProgress = await UserBioGardenProgress.findAll({
				where: { user_id: user.id },
				include: [
					{
						model: BioGardenPlant,
						as: 'plant',
						attributes: ['growth_stages'],
					},
				],
			});

			const progressMap = new Map();
			userProgress.forEach(progress => {
				progressMap.set(progress.plant_id, progress);
			});

			// Форматируем ответ
			const formatted = plants.map(plant => {
				const progress = progressMap.get(plant.id);
				const isUnlocked = !progress
					? plant.required_experience === 0
					: progress.is_unlocked;

				return {
					...plant,
					is_unlocked: isUnlocked,
					current_stage: progress?.current_stage || 0,
					experience_points: progress?.experience_points || 0,
					health_points: progress?.health_points || 0,
					max_health_points: progress?.max_health_points || 100,
					is_completed: progress?.is_completed || false,
					planted_at: progress?.planted_at || null,
				};
			});

			// Рассчитываем общий опыт пользователя
			let totalExperience = 0;
			userProgress.forEach(progress => {
				totalExperience += progress.experience_points;
			});

			res.json({
				success: true,
				data: {
					plants: formatted,
					user_coins: user.coins || 0,
					total_experience: totalExperience,
				},
			});
		} catch (error) {
			console.error('Error fetching plants:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось загрузить список растений',
			});
		}
	}

	// POST /biogarden/plants/:plantId/start
	async startPlant(req: Request, res: Response) {
		try {
			const { plantId } = req.params;
			const { telegramId } = req.body;

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const plant = await BioGardenPlant.findByPk(plantId);
			if (!plant) {
				return res.status(404).json({
					success: false,
					message: 'Растение не найдено',
				});
			}

			// Вместо опыта проверяем только разблокировку
			// (можно сделать проверку на монеты, если нужно)
			// if (user.coins < plant.required_coins) { ... }

			// Проверяем, есть ли уже прогресс
			let progress = await UserBioGardenProgress.findOne({
				where: {
					user_id: user.id,
					plant_id: plant.id,
				},
			});

			if (!progress) {
				// Создаем новый прогресс
				progress = await UserBioGardenProgress.create({
					user_id: user.id,
					plant_id: plant.id,
					current_stage: 1,
					experience_points: 0,
					health_points: 100,
					max_health_points: 100,
					is_unlocked: true,
					is_completed: false,
					planted_at: new Date(),
				});
			} else if (progress.is_completed) {
				return res.status(400).json({
					success: false,
					message: 'Это растение уже полностью выращено',
				});
			}

			res.json({
				success: true,
				data: {
					plant: {
						id: plant.id,
						name: plant.name,
						scientific_name: plant.scientific_name,
					},
					progress: {
						current_stage: progress.current_stage,
						experience_points: progress.experience_points,
						health_points: progress.health_points,
						max_health_points: progress.max_health_points,
					},
				},
				message: `Вы начали выращивать ${plant.name}`,
			});
		} catch (error) {
			console.error('Error starting plant:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось начать выращивание',
			});
		}
	}

	// GET /biogarden/plants/:plantId/current-question
	async getCurrentQuestion(req: Request, res: Response) {
		try {
			const { plantId } = req.params;
			const { telegramId } = req.query;

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const progress = await UserBioGardenProgress.findOne({
				where: {
					user_id: user.id,
					plant_id: Number(plantId),
				},
				include: [
					{
						model: BioGardenPlant,
						as: 'plant',
						attributes: ['growth_stages'],
					},
				],
			});

			if (!progress || !progress.is_unlocked) {
				return res.status(400).json({
					success: false,
					message: 'Сначала начните выращивать это растение',
				});
			}

			if (progress.is_completed) {
				return res.status(400).json({
					success: false,
					message: 'Это растение уже полностью выращено',
				});
			}

			// Получаем случайный вопрос для текущей стадии
			const question = await BioGardenQuestion.findOne({
				where: {
					plant_id: Number(plantId),
					difficulty_level: progress.current_stage,
					is_active: true,
				},
				include: [
					{
						model: BioGardenAnswerOption,
						as: 'options',
						// Не нужно указывать order здесь, sequelize не поддерживает order во include с hasMany
					},
				],
				order: sequelize.random(),
			});

			if (!question) {
				return res.status(404).json({
					success: false,
					message: 'Вопросы для этой стадии не найдены',
				});
			}

			// Сортируем опции вручную
			const sortedOptions = question.options
				? [...question.options].sort((a, b) => a.order_index - b.order_index)
				: [];

			// Форматируем вопрос без правильных ответов
			const formattedQuestion = {
				id: question.id,
				question_text: question.question_text,
				biology_topic: question.biology_topic,
				ege_code: question.ege_code,
				points: question.points,
				options: sortedOptions.map(option => ({
					id: option.id,
					option_text: option.option_text,
					order_index: option.order_index,
				})),
				current_stage: progress.current_stage,
				total_stages: progress.plant?.growth_stages || 5,
			};

			res.json({
				success: true,
				data: {
					question: formattedQuestion,
					progress: {
						current_stage: progress.current_stage,
						health_points: progress.health_points,
						experience_points: progress.experience_points,
					},
				},
			});
		} catch (error) {
			console.error('Error getting question:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось получить вопрос',
			});
		}
	}

	// POST /biogarden/plants/:plantId/answer
	async submitAnswer(req: Request, res: Response) {
		try {
			const { plantId } = req.params;
			const { telegramId, questionId, answerId } = req.body;

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			// Проверяем прогресс
			const progress = await UserBioGardenProgress.findOne({
				where: {
					user_id: user.id,
					plant_id: Number(plantId),
				},
				include: [
					{
						model: BioGardenPlant,
						as: 'plant',
						attributes: ['growth_stages'],
					},
				],
			});

			if (!progress || !progress.is_unlocked) {
				return res.status(400).json({
					success: false,
					message: 'Сначала начните выращивать это растение',
				});
			}

			// Получаем вопрос и правильный ответ
			const question = await BioGardenQuestion.findByPk(questionId, {
				include: [
					{
						model: BioGardenAnswerOption,
						as: 'options',
					},
				],
			});

			if (!question) {
				return res.status(404).json({
					success: false,
					message: 'Вопрос не найден',
				});
			}

			// Исправляем доступ к options
			const questionWithOptions = question as any;
			const options = questionWithOptions.options || [];

			const correctOption = options.find((opt: any) => opt.is_correct);
			const selectedOption = options.find((opt: any) => opt.id === answerId);

			if (!selectedOption) {
				return res.status(400).json({
					success: false,
					message: 'Выбранный вариант ответа не найден',
				});
			}

			const isCorrect = selectedOption.is_correct;
			const earnedExperience = isCorrect ? question.points : 0;
			let earnedCoins = isCorrect ? Math.floor(question.points / 2) : 0;

			// Создаем запись о попытке
			await UserBioGardenAttempt.create({
				user_id: user.id,
				plant_id: Number(plantId),
				stage_number: progress.current_stage,
				question_id: questionId,
				is_correct: isCorrect,
				earned_experience: earnedExperience,
				earned_coins: earnedCoins,
				answered_at: new Date(),
			});

			// Обновляем прогресс
			if (isCorrect) {
				// Добавляем опыт в прогресс растения
				progress.experience_points += earnedExperience;

				// Переходим на следующую стадию, если набрали достаточно опыта
				const requiredExpForStage = progress.current_stage * 50;
				const plantStages = progress.plant?.growth_stages || 5;

				if (
					progress.experience_points >= requiredExpForStage &&
					progress.current_stage < plantStages
				) {
					progress.current_stage += 1;
					progress.experience_points = 0;
				}

				// Проверяем, завершено ли растение
				if (progress.current_stage > plantStages) {
					progress.is_completed = true;
					progress.completed_at = new Date();

					// Награда за завершение
					const completionBonus = 100;
					earnedCoins += completionBonus;
				}

				// Начисляем монеты
				if (earnedCoins > 0) {
					await User.update(
						{
							coins: Number(user.coins) + earnedCoins,
						},
						{
							where: { id: user.id },
						},
					);

					await WalletTransaction.create({
						user_id: user.id,
						type: 'credit',
						amount: earnedCoins,
						source: 'biogarden',
						meta: {
							plant_id: plantId,
							question_id: questionId,
							stage: progress.current_stage,
						},
					});
				}
			} else {
				// Неправильный ответ - уменьшаем здоровье
				progress.health_points -= 20;

				if (progress.health_points <= 0) {
					progress.health_points = 0;
					progress.is_unlocked = false;
				}
			}

			await progress.save();

			res.json({
				success: true,
				data: {
					is_correct: isCorrect,
					correct_answer_id: correctOption?.id,
					explanation: question.explanation,
					earned_experience: earnedExperience,
					earned_coins: earnedCoins,
					progress: {
						current_stage: progress.current_stage,
						experience_points: progress.experience_points,
						health_points: progress.health_points,
						max_health_points: progress.max_health_points,
						is_completed: progress.is_completed,
						is_unlocked: progress.is_unlocked,
					},
				},
			});
		} catch (error) {
			console.error('Error submitting answer:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось обработать ответ',
			});
		}
	}

	// POST /biogarden/plants/:plantId/water
	async waterPlant(req: Request, res: Response) {
		try {
			const { plantId } = req.params;
			const { telegramId } = req.body;

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const progress = await UserBioGardenProgress.findOne({
				where: {
					user_id: user.id,
					plant_id: Number(plantId),
				},
			});

			if (!progress) {
				return res.status(404).json({
					success: false,
					message: 'Прогресс не найден',
				});
			}

			// Проверяем, можно ли полить (например, раз в 6 часов)
			const now = new Date();
			const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

			if (progress.last_watered_at && progress.last_watered_at > sixHoursAgo) {
				return res.status(400).json({
					success: false,
					message: 'Поливать можно раз в 6 часов',
				});
			}

			// Проверяем, хватает ли монет для полива (например, 10 монет)
			const waterCost = 10;
			if (user.coins < waterCost) {
				return res.status(400).json({
					success: false,
					message: `Недостаточно монет для полива. Нужно: ${waterCost}`,
				});
			}

			// Списание монет
			await User.update(
				{
					coins: Number(user.coins) - waterCost,
				},
				{
					where: { id: user.id },
				},
			);

			// Восстанавливаем здоровье
			progress.health_points = Math.min(
				progress.health_points + 30,
				progress.max_health_points,
			);
			progress.last_watered_at = now;
			await progress.save();

			res.json({
				success: true,
				data: {
					health_points: progress.health_points,
					last_watered_at: progress.last_watered_at,
					coins_spent: waterCost,
				},
				message: 'Растение полито! Здоровье восстановлено',
			});
		} catch (error) {
			console.error('Error watering plant:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось полить растение',
			});
		}
	}

	// GET /biogarden/progress
	async getProgress(req: Request, res: Response) {
		try {
			const { telegramId } = req.query;

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const progress = await UserBioGardenProgress.findAll({
				where: { user_id: user.id },
				include: [
					{
						model: BioGardenPlant,
						as: 'plant',
						attributes: [
							'id',
							'name',
							'scientific_name',
							'image_url',
							'growth_stages',
						],
					},
				],
				order: [['planted_at', 'DESC']],
			});

			// Статистика по темам ЕГЭ
			const attempts = await UserBioGardenAttempt.findAll({
				where: { user_id: user.id },
				include: [
					{
						model: BioGardenQuestion,
						as: 'question',
						attributes: ['biology_topic', 'ege_code'],
					},
				],
			});

			const topicStats: Record<string, { total: number; correct: number }> = {};
			attempts.forEach(attempt => {
				const question = (attempt as any).question;
				const topic = question?.biology_topic || 'unknown';
				if (!topicStats[topic]) {
					topicStats[topic] = { total: 0, correct: 0 };
				}
				topicStats[topic].total += 1;
				if (attempt.is_correct) {
					topicStats[topic].correct += 1;
				}
			});

			res.json({
				success: true,
				data: {
					progress: progress.map(p => ({
						plant_id: p.plant_id,
						plant_name: (p as any).plant?.name,
						current_stage: p.current_stage,
						total_stages: (p as any).plant?.growth_stages || 5,
						experience_points: p.experience_points,
						health_points: p.health_points,
						is_completed: p.is_completed,
						planted_at: p.planted_at,
						completed_at: p.completed_at,
					})),
					statistics: {
						total_plants_started: progress.length,
						total_plants_completed: progress.filter(p => p.is_completed).length,
						total_attempts: attempts.length,
						correct_answers: attempts.filter(a => a.is_correct).length,
						accuracy:
							attempts.length > 0
								? Math.round(
										(attempts.filter(a => a.is_correct).length /
											attempts.length) *
											100,
									)
								: 0,
						topic_stats: topicStats,
					},
				},
			});
		} catch (error) {
			console.error('Error fetching progress:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось загрузить прогресс',
			});
		}
	}

	// GET /biogarden/plants/:plantId/progress
	async getPlantProgress(req: Request, res: Response) {
		try {
			const { plantId } = req.params;
			const { telegramId } = req.query;

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const progress = await UserBioGardenProgress.findOne({
				where: {
					user_id: user.id,
					plant_id: Number(plantId),
				},
				include: [
					{
						model: BioGardenPlant,
						as: 'plant',
					},
				],
			});

			if (!progress) {
				return res.status(404).json({
					success: false,
					message: 'Прогресс не найден',
				});
			}

			// Получаем историю попыток для этого растения
			const attempts = await UserBioGardenAttempt.findAll({
				where: {
					user_id: user.id,
					plant_id: Number(plantId),
				},
				include: [
					{
						model: BioGardenQuestion,
						as: 'question',
						attributes: ['question_text', 'biology_topic', 'ege_code'],
					},
				],
				order: [['answered_at', 'DESC']],
				limit: 20,
			});

			res.json({
				success: true,
				data: {
					progress: {
						plant_id: progress.plant_id,
						plant_name: (progress as any).plant?.name,
						current_stage: progress.current_stage,
						total_stages: (progress as any).plant?.growth_stages || 5,
						experience_points: progress.experience_points,
						health_points: progress.health_points,
						max_health_points: progress.max_health_points,
						is_completed: progress.is_completed,
						is_unlocked: progress.is_unlocked,
						planted_at: progress.planted_at,
						last_watered_at: progress.last_watered_at,
					},
					recent_attempts: attempts.map(a => {
						const question = (a as any).question;
						return {
							id: a.id,
							stage_number: a.stage_number,
							question_text: question?.question_text,
							biology_topic: question?.biology_topic,
							ege_code: question?.ege_code,
							is_correct: a.is_correct,
							earned_experience: a.earned_experience,
							earned_coins: a.earned_coins,
							answered_at: a.answered_at,
						};
					}),
				},
			});
		} catch (error) {
			console.error('Error fetching plant progress:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось загрузить прогресс растения',
			});
		}
	}

	// GET /biogarden/stats
	async getStats(req: Request, res: Response) {
		try {
			const { telegramId } = req.query;

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			// Общая статистика по игре
			const totalProgress = await UserBioGardenProgress.findAll({
				where: { user_id: user.id },
			});

			const totalAttempts = await UserBioGardenAttempt.findAll({
				where: { user_id: user.id },
			});

			// Топ растений по опыту
			const plantProgress = await UserBioGardenProgress.findAll({
				where: { user_id: user.id },
				include: [
					{
						model: BioGardenPlant,
						as: 'plant',
						attributes: ['name'],
					},
				],
				order: [['experience_points', 'DESC']],
				limit: 5,
			});

			res.json({
				success: true,
				data: {
					overview: {
						total_plants_started: totalProgress.length,
						total_plants_completed: totalProgress.filter(p => p.is_completed)
							.length,
						total_attempts: totalAttempts.length,
						total_experience_earned: totalAttempts.reduce(
							(sum, a) => sum + a.earned_experience,
							0,
						),
						total_coins_earned: totalAttempts.reduce(
							(sum, a) => sum + a.earned_coins,
							0,
						),
					},
					top_plants: plantProgress.map(p => ({
						plant_id: p.plant_id,
						plant_name: (p as any).plant?.name,
						experience_points: p.experience_points,
						current_stage: p.current_stage,
						is_completed: p.is_completed,
					})),
				},
			});
		} catch (error) {
			console.error('Error fetching stats:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось загрузить статистику',
			});
		}
	}
}

export const biogardenController = new BioGardenController();
