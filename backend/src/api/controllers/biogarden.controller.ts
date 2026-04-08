// controllers/biogarden.controller.ts
import { Request, Response } from 'express';
import {
	User,
	BioGardenPlant,
	BioGardenQuestion,
	BioGardenAnswerOption,
	UserBioGardenProgress,
	UserBioGardenAttempt,
	UserTopicMastery,
	WalletTransaction,
	sequelize,
} from '../../models';
import { Op } from 'sequelize';

class BioGardenController {
	// GET /biogarden/plants
	async getPlants(req: Request, res: Response) {
		try {
			console.log('Received telegramId:', req.query.telegramId); // Логируем входящий параметр

			const { telegramId } = req.query;

			if (!telegramId) {
				return res.status(400).json({
					success: false,
					message: 'telegramId обязателен',
				});
			}

			console.log('Searching for user with telegram_id:', Number(telegramId));

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
				raw: true,
			});

			console.log('Found user:', user);

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
				raw: true,
				include: [
					{
						model: BioGardenPlant,
						as: 'plant',
						attributes: ['growth_stages'],
					},
				],
			});
			console.log(`Found ${userProgress.length} progress records`);
			const progressMap = new Map();
			userProgress.forEach(progress => {
				progressMap.set(progress.plant_id, progress);
			});

			// hp_state для визуала: healthy / medium / low / critical / dead
			const getHpState = (hp: number, max: number): string => {
				if (max <= 0 || hp <= 0) return 'dead';
				const pct = (hp / max) * 100;
				if (pct >= 80) return 'healthy';
				if (pct >= 50) return 'medium';
				if (pct >= 20) return 'low';
				if (pct >= 1) return 'critical';
				return 'dead';
			};

			// Форматируем ответ
			const formatted = plants.map(plant => {
				const progress = progressMap.get(plant.id);
				const isUnlocked = !progress
					? plant.required_experience === 0
					: progress.is_unlocked;
				const hp = progress?.health_points ?? 0;
				const maxHp = progress?.max_health_points ?? 100;

				return {
					...plant,
					is_unlocked: isUnlocked,
					current_stage: progress?.current_stage || 0,
					experience_points: progress?.experience_points || 0,
					health_points: hp,
					max_health_points: maxHp,
					hp_state: progress ? getHpState(hp, maxHp) : 'healthy',
					is_completed: progress?.is_completed || false,
					planted_at: progress?.planted_at || null,
					is_wilted: progress?.is_wilted ?? false,
					revive_sleep_until: progress?.revive_sleep_until ?? null,
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
				raw: true,
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

			// Последовательная разблокировка: растение N можно начать только после предыдущего (по difficulty_level)
			if (plant.difficulty_level > 1) {
				const prevPlant = await BioGardenPlant.findOne({
					where: {
						difficulty_level: plant.difficulty_level - 1,
						is_active: true,
					},
					raw: true,
				});
				if (prevPlant) {
					const prevProgress = await UserBioGardenProgress.findOne({
						where: { user_id: user.id, plant_id: prevPlant.id },
					});
					if (!prevProgress || !prevProgress.planted_at) {
						return res.status(400).json({
							success: false,
							message: `Сначала начните выращивать предыдущее растение: ${prevPlant.name}`,
						});
					}
				}
			}

			// Проверяем, есть ли уже прогресс
			let progress = await UserBioGardenProgress.findOne({
				where: {
					user_id: user.id,
					plant_id: plant.id,
				},
			});

			if (!progress) {
				// Создаем новый прогресс: старт со 2-й стадии и 60 HP
				progress = await UserBioGardenProgress.create({
					user_id: user.id,
					plant_id: plant.id,
					current_stage: 2,
					experience_points: 0,
					health_points: 60,
					max_health_points: 100,
					is_unlocked: true,
					is_completed: false,
					combo_count: 0,
					last_practiced_at: null,
					is_wilted: false,
					revive_sleep_until: null,
					last_decay_at: null,
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
				raw: true,
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

			// Вопрос для стадии: подходят уровни от 1 до current_stage (стадия 2 = блок А, 3–4 = средний/часть B)
			let question = await BioGardenQuestion.findOne({
				where: {
					plant_id: Number(plantId),
					difficulty_level: { [Op.lte]: progress.current_stage },
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

			// Фолбэк: если для текущей стадии нет вопросов, берем любой активный вопрос этого растения.
			// Это защищает игру от "зависания", если сиды по сложностям заполнены неравномерно.
			if (!question) {
				question = await BioGardenQuestion.findOne({
					where: {
						plant_id: Number(plantId),
						is_active: true,
					},
					include: [
						{
							model: BioGardenAnswerOption,
							as: 'options',
						},
					],
					order: sequelize.random(),
				});
			}

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

			const q = question as { timer_seconds?: number };
			const timerSeconds = q.timer_seconds ?? 60;

			// Форматируем вопрос без правильных ответов
			const formattedQuestion = {
				id: question.id,
				question_text: question.question_text,
				biology_topic: question.biology_topic,
				ege_code: question.ege_code,
				points: question.points,
				timer_seconds: timerSeconds,
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
				raw: true,
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

			// Проверяем, не в спячке ли растение после неудачной реанимации
			const now = new Date();
			if (progress.revive_sleep_until && progress.revive_sleep_until > now) {
				return res.status(400).json({
					success: false,
					message: 'Растение сейчас в спячке, попробуйте позже',
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

			// Текущее HP/комбо до ответа
			const hpBefore = progress.health_points;
			const comboBefore = progress.combo_count ?? 0;

			let comboAfter = comboBefore;
			let hpAfter = hpBefore;
			let earnedExperience = 0;
			let earnedCoins = 0;
			let skipStage = false;

			if (isCorrect) {
				// Обновляем серию
				comboAfter = comboBefore + 1;

				// Базовый прирост HP
				let hpGain = 15;

				if (comboAfter >= 10) {
					hpGain = 35;
					skipStage = true;
				} else if (comboAfter >= 5) {
					hpGain = 35;
				} else if (comboAfter >= 3) {
					hpGain = 25;
				}

				hpAfter = Math.min(
					hpBefore + hpGain,
					progress.max_health_points ?? 100,
				);

				// Опыт и монеты зависят от сложности вопроса
				earnedExperience = question.points;
				const difficulty = question.difficulty_level ?? 1;
				earnedCoins = 5 + Math.min(difficulty * 2, 15);
				// Бонус монет за серию 5
				if (comboAfter === 5) {
					earnedCoins += 25;
				}
			} else {
				// Ошибка: сбрасываем серию и отнимаем HP
				comboAfter = 0;
				hpAfter = Math.max(hpBefore - 15, 0);
			}

			// Обновляем прогресс по формуле HP/combo/рост
			progress.health_points = hpAfter;
			progress.combo_count = comboAfter;
			progress.last_practiced_at = now;

			let animation: 'water' | 'dry' | 'revive' | 'stage_up' | null = null;

			if (isCorrect) {
				animation = 'water';

				// Рост стадии: только если HP при ответе >= 80
				const plantStages = progress.plant?.growth_stages || 5;
				const canGrow = hpAfter >= 80 && !progress.is_completed;

				if (canGrow) {
					let newStage = progress.current_stage;
					if (skipStage) {
						newStage += 2;
					} else {
						newStage += 1;
					}
					if (newStage > plantStages) {
						newStage = plantStages;
					}

					if (newStage !== progress.current_stage) {
						progress.current_stage = newStage;
						animation = 'stage_up';
					}

					// Полное выращивание растения
					if (progress.current_stage >= plantStages && !progress.is_completed) {
						progress.is_completed = true;
						progress.completed_at = now;
						earnedCoins += 100;
					}
				}
			} else {
				animation = 'dry';

				if (hpAfter <= 0) {
					progress.health_points = 0;
					progress.is_unlocked = false;
					progress.is_wilted = true;
				}
			}

			// Создаем запись о попытке
			await UserBioGardenAttempt.create({
				user_id: user.id,
				plant_id: Number(plantId),
				stage_number: progress.current_stage,
				question_id: questionId,
				is_correct: isCorrect,
				earned_experience: earnedExperience,
				earned_coins: earnedCoins,
				hp_before: hpBefore,
				hp_after: hpAfter,
				combo_before: comboBefore,
				combo_after: comboAfter,
				answered_at: now,
			});

			// Обновляем мастерство по коду ЕГЭ
			if (question.ege_code) {
				const [mastery] = await UserTopicMastery.findOrCreate({
					where: {
						user_id: user.id,
						ege_code: question.ege_code,
					},
					defaults: {
						user_id: user.id,
						ege_code: question.ege_code,
						correct_count: 0,
						total_count: 0,
						accuracy: 0,
						mastery_level: 'novice',
					},
				});

				mastery.total_count += 1;
				if (isCorrect) {
					mastery.correct_count += 1;
				}

				if (mastery.total_count > 0) {
					mastery.accuracy = Math.round(
						(mastery.correct_count / mastery.total_count) * 100,
					);
				}

				if (mastery.accuracy >= 80) {
					mastery.mastery_level = 'expert';
				} else if (mastery.accuracy >= 60) {
					mastery.mastery_level = 'know';
				} else if (mastery.accuracy >= 40) {
					mastery.mastery_level = 'learning';
				} else {
					mastery.mastery_level = 'novice';
				}

				await mastery.save();
			}

			// Начисляем монеты пользователю
			if (earnedCoins > 0) {
				const userCoins = Number(user.coins) || 0;
				const newCoins = userCoins + earnedCoins;

				// Обновляем streak по дням активности
				const today = new Date();
				const userLastActive = (user as any).last_active_date as Date | null;
				let currentStreak = (user as any).current_streak || 0;
				let longestStreak = (user as any).longest_streak || 0;

				const startOfToday = new Date(
					today.getFullYear(),
					today.getMonth(),
					today.getDate(),
				);

				let shouldUpdateStreak = true;

				if (userLastActive) {
					const last = new Date(userLastActive);
					const startOfLast = new Date(
						last.getFullYear(),
						last.getMonth(),
						last.getDate(),
					);

					const diffDays =
						(startOfToday.getTime() - startOfLast.getTime()) /
						(1000 * 60 * 60 * 24);

					if (diffDays === 0) {
						// Уже учитывали сегодняшний день
						shouldUpdateStreak = false;
					} else if (diffDays === 1) {
						currentStreak += 1;
					} else {
						currentStreak = 1;
					}
				} else {
					currentStreak = 1;
				}

				if (shouldUpdateStreak) {
					if (currentStreak > longestStreak) {
						longestStreak = currentStreak;
					}

					// Можно добавить небольшие бонусы за большие серии
					let streakBonus = 0;
					if (currentStreak > 0 && currentStreak % 5 === 0) {
						streakBonus = 10;
					}

					const totalCoinsWithStreak = newCoins + streakBonus;

					await User.update(
						{
							coins: totalCoinsWithStreak,
							current_streak: currentStreak,
							longest_streak: longestStreak,
							last_active_date: startOfToday,
						},
						{
							where: { id: user.id },
						},
					);

					if (streakBonus > 0) {
						await WalletTransaction.create({
							user_id: user.id,
							type: 'credit',
							amount: streakBonus,
							source: 'biogarden_streak_bonus',
							meta: {
								plant_id: plantId,
								current_streak: currentStreak,
							},
						});
					}
				} else {
					await User.update(
						{
							coins: newCoins,
						},
						{
							where: { id: user.id },
						},
					);
				}

				await WalletTransaction.create({
					user_id: user.id,
					type: 'credit',
					amount: earnedCoins,
					source: 'biogarden',
					meta: {
						plant_id: plantId,
						question_id: questionId,
						stage: progress.current_stage,
						combo: comboAfter,
					},
				});
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
					animation,
					combo_count: comboAfter,
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
				raw: true,
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
				raw: true,
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

			const userPlain = user as {
				current_streak?: number;
				longest_streak?: number;
			};
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
						is_wilted: p.is_wilted ?? false,
						revive_sleep_until: p.revive_sleep_until ?? null,
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
						current_streak: userPlain.current_streak ?? 0,
						longest_streak: userPlain.longest_streak ?? 0,
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
				raw: true,
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
						hp_state: (() => {
							const h = progress.health_points;
							const m = progress.max_health_points || 100;
							if (m <= 0 || h <= 0) return 'dead';
							const pct = (h / m) * 100;
							if (pct >= 80) return 'healthy';
							if (pct >= 50) return 'medium';
							if (pct >= 20) return 'low';
							return 'critical';
						})(),
						is_completed: progress.is_completed,
						is_unlocked: progress.is_unlocked,
						planted_at: progress.planted_at,
						last_watered_at: progress.last_watered_at,
						is_wilted: progress.is_wilted ?? false,
						revive_sleep_until: progress.revive_sleep_until ?? null,
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
				raw: true,
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

			const userPlain = user as {
				current_streak?: number;
				longest_streak?: number;
			};
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
						current_streak: userPlain.current_streak ?? 0,
						longest_streak: userPlain.longest_streak ?? 0,
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

	// GET /biogarden/plants/:plantId/revive-question — вопрос для реанимации (уровень ЕГЭ часть B)
	async getReviveQuestion(req: Request, res: Response) {
		try {
			const { plantId } = req.params;
			const { telegramId } = req.query;

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

			if (!progress || !progress.is_wilted) {
				return res.status(400).json({
					success: false,
					message: 'Растение не завяло или прогресс не найден',
				});
			}

			const now = new Date();
			if (progress.revive_sleep_until && progress.revive_sleep_until > now) {
				return res.status(400).json({
					success: false,
					message: 'Растение в спячке до следующей попытки реанимации',
					revive_sleep_until: progress.revive_sleep_until,
				});
			}

			// Вопрос уровня ЕГЭ часть B — сложность 4 или 5
			const question = await BioGardenQuestion.findOne({
				where: {
					plant_id: Number(plantId),
					difficulty_level: { [Op.gte]: 4 },
					is_active: true,
				},
				include: [
					{
						model: BioGardenAnswerOption,
						as: 'options',
					},
				],
				order: sequelize.random(),
			});

			if (!question) {
				return res.status(404).json({
					success: false,
					message: 'Нет подходящих вопросов для реанимации',
				});
			}

			const q = question as unknown as { options?: { order_index: number }[] };
			const sortedOptions = (q.options || [])
				.slice()
				.sort((a, b) => a.order_index - b.order_index);
			res.json({
				success: true,
				data: {
					question: {
						id: question.id,
						question_text: question.question_text,
						biology_topic: question.biology_topic,
						ege_code: question.ege_code,
						points: question.points,
						options: (
							sortedOptions as Array<{
								id: number;
								option_text: string;
								order_index: number;
							}>
						).map(opt => ({
							id: opt.id,
							option_text: opt.option_text,
							order_index: opt.order_index,
						})),
					},
					is_revive: true,
				},
			});
		} catch (error) {
			console.error('Error getting revive question:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось получить вопрос реанимации',
			});
		}
	}

	// POST /biogarden/plants/:plantId/revive — реанимация: за монеты или запрос вопроса
	async revive(req: Request, res: Response) {
		try {
			const { plantId } = req.params;
			const { telegramId, mode } = req.body;

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

			const progress = await UserBioGardenProgress.findOne({
				where: {
					user_id: user.id,
					plant_id: Number(plantId),
				},
			});

			if (!progress || !progress.is_wilted) {
				return res.status(400).json({
					success: false,
					message: 'Растение не завяло',
				});
			}

			const now = new Date();
			if (progress.revive_sleep_until && progress.revive_sleep_until > now) {
				return res.status(400).json({
					success: false,
					message: 'Растение в спячке, попробуйте позже',
					revive_sleep_until: progress.revive_sleep_until,
				});
			}

			if (mode === 'coins') {
				const cost = 50;
				if (Number(user.coins) < cost) {
					return res.status(400).json({
						success: false,
						message: `Недостаточно монет. Нужно: ${cost}`,
					});
				}

				await User.update(
					{ coins: Number(user.coins) - cost },
					{ where: { id: user.id } },
				);
				await WalletTransaction.create({
					user_id: user.id,
					type: 'debit',
					amount: cost,
					source: 'biogarden_revive',
					meta: { plant_id: Number(plantId) },
				});

				progress.health_points = 40;
				progress.is_wilted = false;
				progress.is_unlocked = true;
				progress.revive_sleep_until = null;
				progress.combo_count = 0;
				await progress.save();

				return res.json({
					success: true,
					data: {
						revived: true,
						health_points: 40,
						coins_spent: cost,
					},
					message: 'Растение оживлено за монеты',
				});
			}

			// Режим "вопрос" — клиент должен запросить вопрос через GET revive-question и ответить через revive-answer
			return res.json({
				success: true,
				data: {
					revived: false,
					need_question: true,
					message:
						'Запросите вопрос GET /plants/:plantId/revive-question и ответьте POST /plants/:plantId/revive-answer',
				},
			});
		} catch (error) {
			console.error('Error reviving plant:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось выполнить реанимацию',
			});
		}
	}

	// POST /biogarden/plants/:plantId/revive-answer — ответ на вопрос реанимации
	async reviveAnswer(req: Request, res: Response) {
		try {
			const { plantId } = req.params;
			const { telegramId, questionId, answerId } = req.body;

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

			const progress = await UserBioGardenProgress.findOne({
				where: {
					user_id: user.id,
					plant_id: Number(plantId),
				},
			});

			if (!progress || !progress.is_wilted) {
				return res.status(400).json({
					success: false,
					message: 'Растение не завяло',
				});
			}

			const question = await BioGardenQuestion.findByPk(questionId, {
				include: [{ model: BioGardenAnswerOption, as: 'options' }],
			});
			if (!question) {
				return res.status(404).json({
					success: false,
					message: 'Вопрос не найден',
				});
			}

			const q = question as unknown as {
				options?: { id: number; is_correct: boolean }[];
			};
			const options = q.options || [];
			const correctOption = options.find(
				(o: { is_correct: boolean }) => o.is_correct,
			);
			const selected = options.find((o: { id: number }) => o.id === answerId);
			if (!selected) {
				return res.status(400).json({
					success: false,
					message: 'Вариант ответа не найден',
				});
			}

			const isCorrect = selected.is_correct;
			const now = new Date();

			if (isCorrect) {
				progress.health_points = 40;
				progress.is_wilted = false;
				progress.is_unlocked = true;
				progress.revive_sleep_until = null;
				progress.combo_count = 0;
				progress.last_practiced_at = now;
				await progress.save();

				return res.json({
					success: true,
					data: {
						is_correct: true,
						revived: true,
						health_points: 40,
						explanation: question.explanation,
						progress: {
							health_points: progress.health_points,
							is_wilted: progress.is_wilted,
							is_unlocked: progress.is_unlocked,
						},
					},
					message: 'Растение ожило!',
				});
			}

			// Неверный ответ — спячка 24 часа (decay в cron не применяется)
			const sleepUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
			progress.revive_sleep_until = sleepUntil;
			await progress.save();

			return res.json({
				success: true,
				data: {
					is_correct: false,
					revived: false,
					correct_answer_id: correctOption?.id,
					explanation: question.explanation,
					revive_sleep_until: sleepUntil,
					message: 'Растение в спячке 24 часа. Попробуйте снова завтра.',
				},
			});
		} catch (error) {
			console.error('Error revive answer:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось обработать ответ реанимации',
			});
		}
	}
}

export const biogardenController = new BioGardenController();
