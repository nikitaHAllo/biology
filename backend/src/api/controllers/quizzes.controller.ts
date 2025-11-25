import { Request, Response } from 'express';
import { Quiz, QuizQuestion, QuizOption } from '../../models';

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
