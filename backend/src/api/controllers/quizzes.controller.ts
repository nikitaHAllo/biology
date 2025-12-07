import { Request, Response } from 'express';
import {
	Quiz,
	QuizQuestion,
	QuizOption,
	WalletTransaction,
	UserProgress,
	User,
	UserQuizResult,
} from '../../models';

class QuizzesController {
	async list(req: Request, res: Response) {
		try {
			const { telegramId } = req.query;

			// 1. Получаем все активные тесты
			const quizzes = await Quiz.findAll({
				where: { is_active: true },
				order: [['created_at', 'ASC']],
				raw: true,
			});

			let formatted;

			// 2. Если передан telegramId, проверяем пройденные тесты
			if (telegramId) {
				try {
					// Ищем пользователя
					const user = await User.findOne({
						where: { telegram_id: Number(telegramId) },
						raw: true,
					});

					if (user) {
						// Получаем результаты пользователя
						const userQuizResults = await UserQuizResult.findAll({
							where: { user_id: user.id },
							raw: true,
						});

						// Создаем мапу для быстрого поиска
						const resultsMap = new Map();
						userQuizResults.forEach(result => {
							resultsMap.set(result.quiz_id, result);
						});

						// Создаем форматированный массив с правильными статусами
						formatted = quizzes.map(quiz => {
							const result = resultsMap.get(quiz.id);
							return {
								...quiz,
								is_completed: !!result?.is_passed,
								score: result?.score || null,
								earned_coins: result?.earned_coins || null,
								completed_at: result?.submitted_at || null,
							};
						});
					} else {
						// Пользователь не найден - все тесты непройденные
						formatted = quizzes.map(quiz => ({
							...quiz,
							is_completed: false,
							score: null,
							earned_coins: null,
							completed_at: null,
						}));
					}
				} catch (userError) {
					console.warn('Error checking user progress:', userError);
					// В случае ошибки - все тесты непройденные
					formatted = quizzes.map(quiz => ({
						...quiz,
						is_completed: false,
						score: null,
						earned_coins: null,
						completed_at: null,
					}));
				}
			} else {
				// telegramId не передан - все тесты непройденные
				formatted = quizzes.map(quiz => ({
					...quiz,
					is_completed: false,
					score: null,
					earned_coins: null,
					completed_at: null,
				}));
			}

			res.json({
				success: true,
				data: {
					quizzes: formatted,
				},
			});
		} catch (error) {
			console.error('Error fetching quizzes:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось загрузить список викторин',
			});
		}
	}
	// POST /quizzes/:quizId/complete
	async complete(req: Request, res: Response) {
		try {
			const { quizId } = req.params;
			const { telegramId, score, earned_coins } = req.body;
			const quizIdNum = Number(quizId);

			const scoreNum = Number(score);
			const earnedCoinsNum = Number(earned_coins);
			const user = await User.findOne({
				where: { telegram_id: telegramId },
				raw: true,
			});

			if (!user)
				return res
					.status(404)
					.json({ success: false, message: 'Пользователь не найден' });

			console.log('Айди', user, user.id);

			const status = scoreNum >= 2 ? 'completed' : 'pending';
			const isPassed = status === 'completed';

			const existing = await UserQuizResult.findOne({
				where: {
					user_id: user.id,
					quiz_id: quizIdNum,
				},
				raw: true,
			});

			let userQuizResult;
			let isNewRecord = false;

			if (existing) {
				const existingScoreNum = Number(existing.score);
				// Обновляем существующую запись, если новый результат лучше
				if (scoreNum > existingScoreNum) {
					await UserQuizResult.update(
						{
							score: scoreNum,
							earned_coins: earnedCoinsNum,
							is_passed: isPassed,
							submitted_at: new Date(),
						},
						{
							where: {
								user_id: user.id,
								quiz_id: quizIdNum,
							},
						}
					);

					userQuizResult = await UserQuizResult.findOne({
						where: {
							user_id: user.id,
							quiz_id: quizIdNum,
						},
					});

					console.log(
						'Обновлён результат теста. Новый счёт:',
						score,
						'Старый:',
						existing.score
					);
				} else {
					// Новый результат не лучше - возвращаем существующий
					return res.json({
						success: true,
						data: {
							status: 'not_improved',
							quiz_id: quizIdNum,
							score: existing.score,
							earned_coins: existing.earned_coins,
							message: 'Новый результат не лучше предыдущего',
						},
					});
				}
			} else {
				// 🔥 Создаем новую попытку
				userQuizResult = await UserQuizResult.create({
					user_id: user.id,
					quiz_id: quizIdNum,
					score: scoreNum,
					earned_coins: earnedCoinsNum,
					is_passed: isPassed,
					submitted_at: new Date(),
				});
				isNewRecord = true;
			}
			let progress = await UserProgress.findOne({
				where: { user_id: user.id, quiz_id: quizIdNum },
				raw: true,
			});
			if (!progress) {
				progress = await UserProgress.create({
					user_id: user.id,
					quiz_id: quizIdNum,
					is_completed: true,
					score: scoreNum,
					earned_coins: earnedCoinsNum,
					completed_at: new Date(),
					status,
				});
			} else if (scoreNum > Number(progress.score)) {
				await UserProgress.update(
					{
						score: scoreNum,
						earned_coins: earnedCoinsNum,
						is_completed: isPassed,
						completed_at: new Date(),
						status,
					},
					{
						where: {
							user_id: user.id,
							quiz_id: quizIdNum,
						},
					}
				);
			}

			let coinsToAdd = 0;
			const existingEarnedCoins = existing ? Number(existing.earned_coins) : 0;

			if (isNewRecord) {
				// Первое прохождение - начисляем все монеты
				coinsToAdd = earnedCoinsNum;
			} else if (existing && scoreNum > Number(existing.score)) {
				// Повторное прохождение с лучшим результатом - начисляем разницу
				coinsToAdd = earnedCoinsNum - existingEarnedCoins;
				if (coinsToAdd < 0) coinsToAdd = 0; // На всякий случай
			}

			if (coinsToAdd > 0) {
				// Начисляем монеты
				await User.update(
					{
						coins: Number(user.coins) + Number(coinsToAdd),
					},
					{
						where: { id: user.id },
					}
				);
			}
			// Добавляем транзакцию в кошелек
			await WalletTransaction.create({
				user_id: user.id,
				type: 'credit',
				amount: coinsToAdd,
				source: 'quiz',
				meta: { quiz_id: quizIdNum },
			});

			return res.json({
				success: true,
				message: 'Прогресс сохранён',
				data: progress,
			});
		} catch (error) {
			console.error(error);
			res
				.status(500)
				.json({ success: false, message: 'Ошибка сохранения прогресса' });
		}
	}

	async details(req: Request, res: Response) {
		try {
			const { quizId } = req.params;

			const quiz = await Quiz.findByPk(quizId, {
				include: [
					{
						model: QuizQuestion,
						as: 'questions',
						include: [
							{
								model: QuizOption,
								as: 'options',
							},
						],
					},
				],
			});

			if (!quiz) {
				return res.status(404).json({
					success: false,
					message: 'Викторина не найдена',
				});
			}

			const quizPlain = quiz.get({
				plain: true,
			}) as Quiz & {
				questions?: Array<
					QuizQuestion & {
						options?: QuizOption[];
					}
				>;
			};

			const formatted = {
				id: quizPlain.id,
				title: quizPlain.title,
				description: quizPlain.description,
				total_questions: quizPlain.total_questions,
				total_points: quizPlain.total_points,
				estimated_minutes: quizPlain.estimated_minutes,
				is_completed: false,
				questions: (quizPlain.questions || [])
					.sort((a, b) => a.order_index - b.order_index)
					.map(question => {
						const options = (question.options || []).sort(
							(a, b) => a.order_index - b.order_index
						);
						const correctAnswerIds = options
							.filter(option => option.is_correct)
							.map(option => option.id);

						return {
							id: question.id,
							quiz_id: question.quiz_id,
							question_text: question.question_text,
							question_type: question.question_type,
							options: options.map(option => ({
								id: option.id,
								question_id: option.question_id,
								option_text: option.option_text,
								is_correct: option.is_correct,
								order: option.order_index,
							})),
							correct_answer_ids: correctAnswerIds,
							explanation: question.explanation || undefined,
							points: question.points,
							order: question.order_index,
							timer_seconds: question.timer_seconds,
						};
					}),
			};

			res.json({
				success: true,
				data: {
					quiz: formatted,
				},
			});
		} catch (error) {
			console.error('Error fetching quiz details:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось загрузить викторину',
			});
		}
	}
}

export const quizzesController = new QuizzesController();
