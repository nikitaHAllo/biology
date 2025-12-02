import { Request, Response } from 'express';
import {
	Quiz,
	QuizQuestion,
	QuizOption,
	WalletTransaction,
	UserProgress,
	User,
} from '../../models';

class QuizzesController {
	async list(_req: Request, res: Response) {
		try {
			const quizzes = await Quiz.findAll({
				where: { is_active: true },
				order: [['created_at', 'ASC']],
				raw: true, // ← добавляем это
			});

			const formatted = quizzes.map(quiz => ({
				...quiz,
				is_completed: false,
			}));

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

			const user = await User.findOne({
				where: { telegram_id: telegramId },
				raw: true,
			});
			if (!user)
				return res
					.status(404)
					.json({ success: false, message: 'Пользователь не найден' });
			console.log(req.body, earned_coins);
			// Проверяем — есть ли уже прогресс по этому квизу
			let progress = await UserProgress.findOne({
				where: { user_id: user.id, quiz_id: quizId },
				raw: true,
			});

			const status = score >= 2 ? 'completed' : 'pending';

			if (!progress) {
				progress = await UserProgress.create({
					user_id: user.id,
					quiz_id: Number(quizId),
					is_completed: true,
					score,
					earned_coins,
					completed_at: new Date(),
					status,
				});
			} else {
				// обновляем только если результат лучше
				if (score > progress.score) {
					progress.score = score;
					progress.earned_coins = earned_coins;
					progress.is_completed = true;
					progress.completed_at = new Date();
					await progress.save();
				}
			}

			// Начисляем монеты пользователю
			 await User.update(
					{
						coins: Number(user.coins) + Number(earned_coins),
					},
					{
						where: { id: user.id },
					}
				);


			// Добавляем запись в кошелек
			await WalletTransaction.create({
				user_id: user.id,
				type: 'credit',
				amount: earned_coins,
				source: 'quiz',
				meta: { quiz_id: Number(quizId) },
			});
			console.log(progress);
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
