import { Request, Response } from 'express';
import { OpenAnswer, QuizQuestion, User } from '../../models';

const REVIEW_COST = 10; // repcoins per review request

class OpenAnswersController {
	// POST /quizzes/questions/:questionId/open-answer
	async submitAnswer(req: Request, res: Response) {
		try {
			const user = req.user as User;
			const questionId = Number(req.params.questionId);
			const { answer_text, quiz_id } = req.body as { answer_text?: string; quiz_id?: number };

			if (!answer_text?.trim()) {
				return res.status(400).json({ success: false, message: 'Текст ответа обязателен' });
			}
			if (!quiz_id) {
				return res.status(400).json({ success: false, message: 'quiz_id обязателен' });
			}

			const question = await QuizQuestion.findByPk(questionId);
			if (!question || question.question_type !== 'open_ended') {
				return res.status(404).json({ success: false, message: 'Вопрос не найден или не является открытым' });
			}

			const [answer, created] = await OpenAnswer.upsert({
				user_id: user.id,
				question_id: questionId,
				quiz_id,
				answer_text: answer_text.trim(),
				review_status: 'not_requested',
			}, { conflictFields: ['user_id', 'question_id'] });

			return res.status(created ? 201 : 200).json({ success: true, data: { answer } });
		} catch (e) {
			console.error('submitAnswer error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сохранения ответа' });
		}
	}

	// GET /quizzes/questions/:questionId/open-answer
	async getAnswer(req: Request, res: Response) {
		try {
			const user = req.user as User;
			const questionId = Number(req.params.questionId);

			const answer = await OpenAnswer.findOne({
				where: { user_id: user.id, question_id: questionId },
			});

			return res.json({ success: true, data: { answer } });
		} catch (e) {
			console.error('getAnswer error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка получения ответа' });
		}
	}

	// POST /quizzes/open-answers/:id/request-review
	async requestReview(req: Request, res: Response) {
		try {
			const user = req.user as User;
			const answerId = Number(req.params.id);

			const answer = await OpenAnswer.findOne({
				where: { id: answerId, user_id: user.id },
			});
			if (!answer) {
				return res.status(404).json({ success: false, message: 'Ответ не найден' });
			}
			if (answer.review_status !== 'not_requested') {
				return res.status(400).json({ success: false, message: 'Проверка уже запрошена или выполнена' });
			}
			if (user.coins < REVIEW_COST) {
				return res.status(400).json({ success: false, message: `Недостаточно монет. Нужно ${REVIEW_COST}, у вас ${user.coins}` });
			}

			user.coins -= REVIEW_COST;
			await user.save();

			answer.review_status = 'pending';
			answer.repcoins_spent = REVIEW_COST;
			await answer.save();

			return res.json({ success: true, data: { answer, coins_left: user.coins, review_cost: REVIEW_COST } });
		} catch (e) {
			console.error('requestReview error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка запроса проверки' });
		}
	}

	// ── Admin endpoints ──────────────────────────────────────────────────────

	// GET /admin/open-answers
	async adminList(_req: Request, res: Response) {
		try {
			const answers = await OpenAnswer.findAll({
				include: [
					{ model: User, as: 'user', attributes: ['id', 'username', 'telegram_id', 'email'] },
					{ model: QuizQuestion, as: 'question', attributes: ['id', 'question_text', 'quiz_id'] },
				],
				order: [['submitted_at', 'DESC']],
			});
			return res.json({ success: true, data: { answers } });
		} catch (e) {
			console.error('adminList openAnswers error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка получения ответов' });
		}
	}

	// PUT /admin/open-answers/:id/review
	async adminReview(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const { score, teacher_comment } = req.body as { score?: number; teacher_comment?: string };

			if (score === undefined) {
				return res.status(400).json({ success: false, message: 'score обязателен' });
			}

			const answer = await OpenAnswer.findByPk(id);
			if (!answer) {
				return res.status(404).json({ success: false, message: 'Ответ не найден' });
			}

			answer.score = score;
			answer.teacher_comment = teacher_comment ?? null;
			answer.review_status = 'reviewed';
			answer.reviewed_at = new Date();
			await answer.save();

			return res.json({ success: true, data: { answer } });
		} catch (e) {
			console.error('adminReview error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сохранения проверки' });
		}
	}
}

export const openAnswersController = new OpenAnswersController();
export { REVIEW_COST };
