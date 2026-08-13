import { Request, Response } from 'express';
import {
	Quiz,
	QuizQuestion,
	QuizOption,
	QuizCategory,
	WalletTransaction,
	UserProgress,
	User,
	UserQuizResult,
} from '../../models';

class QuizzesController {
	private async resolveUser(req: Request): Promise<User | null> {
		if (req.user) return req.user;
		const telegramId = (req.query.telegramId ?? req.body?.telegramId) as string | undefined;
		if (!telegramId) return null;
		return User.findOne({ where: { telegram_id: Number(telegramId) } });
	}

	async list(req: Request, res: Response) {
		try {
			const quizzesRaw = await Quiz.findAll({
				where: { is_active: true },
				order: [['created_at', 'ASC']],
				include: [{ model: QuizCategory, as: 'category', attributes: ['id', 'title', 'color', 'icon'] }],
			});

			const quizzes = quizzesRaw.map(q => q.get({ plain: true }));

			let formatted;
			const user = await this.resolveUser(req);

			if (user) {
				const userQuizResults = await UserQuizResult.findAll({
					where: { user_id: user.id },
					raw: true,
				});

				const resultsMap = new Map();
				userQuizResults.forEach(result => {
					resultsMap.set(result.quiz_id, result);
				});

				formatted = quizzes.map(quiz => {
					const result = resultsMap.get(quiz.id);
					return {
						...quiz,
						is_completed: !!result?.is_passed,
						score: result?.score ?? null,
						earned_coins: result?.earned_coins ?? null,
						completed_at: result?.submitted_at ?? null,
						category: (quiz as any).category ?? null,
					};
				});
			} else {
				formatted = quizzes.map(quiz => ({
					...quiz,
					is_completed: false,
					score: null,
					earned_coins: null,
					completed_at: null,
					category: (quiz as any).category ?? null,
				}));
			}

			res.json({
				success: true,
				data: { quizzes: formatted },
			});
		} catch (error) {
			console.error('Error fetching quizzes:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось загрузить список викторин',
			});
		}
	}

	async complete(req: Request, res: Response) {
		try {
			const { quizId } = req.params;
			const { score } = req.body;

			const quizIdNum = Number(quizId);
			if (!Number.isInteger(quizIdNum) || quizIdNum <= 0) {
				return res.status(400).json({
					success: false,
					message: 'Некорректный идентификатор викторины',
				});
			}

			const scoreNum = Number(score);

			const quiz = await Quiz.findByPk(quizIdNum, {
				include: [{ model: QuizQuestion, as: 'questions' }],
			});
			if (!quiz) {
				return res.status(404).json({ success: false, message: 'Викторина не найдена' });
			}

			const user = await this.resolveUser(req);
			if (!user) {
				return res.status(401).json({ success: false, message: 'Требуется авторизация' });
			}

			const questions = (quiz as any).questions as QuizQuestion[] ?? [];
			const scoredCount = questions.filter((q: QuizQuestion) => q.question_type !== 'open_ended').length;
			// Pure open_ended quiz has no scored part — always passes on submit
			const isPassed = scoredCount === 0
				? quiz.total_questions > 0
				: scoreNum === scoredCount;
			const status = isPassed ? 'completed' : 'pending';

			const existing = await UserQuizResult.findOne({
				where: { user_id: user.id, quiz_id: quizIdNum },
				raw: true,
			});

			let coinsToAdd = 0;

			if (!existing) {
				if (isPassed) coinsToAdd = quiz.coins_reward;
				await UserQuizResult.create({
					user_id: user.id,
					quiz_id: quizIdNum,
					score: scoreNum,
					earned_coins: coinsToAdd,
					is_passed: isPassed,
					submitted_at: new Date(),
				});
			} else if (!existing.is_passed && isPassed) {
				coinsToAdd = quiz.coins_reward;
				await UserQuizResult.update(
					{ score: scoreNum, is_passed: isPassed, earned_coins: coinsToAdd, submitted_at: new Date() },
					{ where: { user_id: user.id, quiz_id: quizIdNum } }
				);
			} else if (scoreNum > Number(existing.score)) {
				await UserQuizResult.update(
					{ score: scoreNum, is_passed: isPassed, submitted_at: new Date() },
					{ where: { user_id: user.id, quiz_id: quizIdNum } }
				);
			}

			const [progress, created] = await UserProgress.findOrCreate({
				where: { user_id: user.id, quiz_id: quizIdNum },
				defaults: {
					user_id: user.id,
					quiz_id: quizIdNum,
					is_completed: isPassed,
					score: scoreNum,
					earned_coins: coinsToAdd,
					completed_at: new Date(),
					status,
				},
			});

			if (!created && scoreNum > Number(progress.score)) {
				await UserProgress.update(
					{ score: scoreNum, is_completed: isPassed, status, completed_at: new Date() },
					{ where: { user_id: user.id, quiz_id: quizIdNum } }
				);
			}

			if (coinsToAdd > 0) {
				await User.update(
					{ coins: Number(user.coins) + coinsToAdd },
					{ where: { id: user.id } }
				);
				await WalletTransaction.create({
					user_id: user.id,
					type: 'credit',
					amount: coinsToAdd,
					source: 'quiz',
					meta: { quiz_id: quizIdNum },
				});
			}

			return res.json({
				success: true,
				message: 'Прогресс сохранён',
				data: {
					quiz_id: quizIdNum,
					score: scoreNum,
					earned_coins: coinsToAdd,
					status,
				},
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ success: false, message: 'Ошибка сохранения прогресса' });
		}
	}

	async details(req: Request, res: Response) {
		try {
			const { quizId } = req.params;

			const quizIdNum = Number(quizId);
			if (!Number.isInteger(quizIdNum) || quizIdNum <= 0) {
				return res.status(400).json({
					success: false,
					message: 'Некорректный идентификатор викторины',
				});
			}

			const quiz = await Quiz.findByPk(quizIdNum, {
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
							image_url: question.image_url ?? null,
						};
					}),
			};

			res.json({
				success: true,
				data: { quiz: formatted },
			});
		} catch (error) {
			console.error('Error fetching quiz details:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось загрузить викторину',
			});
		}
	}
	async getCategories(_req: Request, res: Response) {
		try {
			const categories = await QuizCategory.findAll({
				order: [['order_index', 'ASC'], ['title', 'ASC']],
				raw: true,
			});
			res.json({ success: true, data: { categories } });
		} catch (error) {
			console.error('Error fetching quiz categories:', error);
			res.status(500).json({ success: false, message: 'Ошибка загрузки категорий' });
		}
	}
}

export const quizzesController = new QuizzesController();
