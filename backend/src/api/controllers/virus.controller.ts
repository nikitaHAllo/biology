import { Request, Response } from 'express';
import { VirusCase, VirusChapter, VirusChapterOption, VirusResult, User, WalletTransaction } from '../../models';

// ── resolveUser ───────────────────────────────────────────────────────────────

async function resolveUser(req: Request): Promise<User | null> {
	const jwtUser = (req as any).user;
	if (jwtUser?.id) {
		return User.findByPk(jwtUser.id);
	}
	const telegramId = (req.body?.telegramId ?? req.query?.telegramId) as string | undefined;
	if (telegramId) {
		return User.findOne({ where: { telegram_id: Number(telegramId) } });
	}
	return null;
}

class VirusController {
	// GET /virus/cases
	async list(req: Request, res: Response) {
		try {
			const cases = await VirusCase.findAll({
				where: { is_active: true },
				order: [['order_index', 'ASC'], ['created_at', 'ASC']],
				attributes: ['id', 'title', 'description', 'role_description', 'difficulty', 'coins_reward', 'order_index'],
			});

			const user = await resolveUser(req);
			if (!user) {
				return res.json({
					success: true,
					data: { cases: cases.map(c => ({ ...c.get({ plain: true }), is_completed: false, score: null })) },
				});
			}

			const results = await VirusResult.findAll({ where: { user_id: user.id }, raw: true });
			const resultMap = new Map(results.map(r => [r.case_id, r]));

			const formatted = cases.map(c => {
				const r = resultMap.get(c.id);
				return {
					...c.get({ plain: true }),
					is_completed: r?.is_completed ?? false,
					score: r?.score ?? null,
					correct_answers: r?.correct_answers ?? null,
					coins_earned: r?.coins_earned ?? null,
				};
			});

			return res.json({ success: true, data: { cases: formatted } });
		} catch (e) {
			console.error('Virus list error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка загрузки случаев' });
		}
	}

	// GET /virus/cases/:id
	async getCase(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const virusCase = await VirusCase.findByPk(id, {
				include: [
					{
						model: VirusChapter,
						as: 'chapters',
						include: [
							{
								model: VirusChapterOption,
								as: 'options',
								attributes: ['id', 'chapter_id', 'order_index', 'text', 'consequence_text'],
							},
						],
					},
				],
			});

			if (!virusCase) return res.status(404).json({ success: false, message: 'Случай не найден' });

			const plain = virusCase.get({ plain: true }) as any;
			plain.chapters = (plain.chapters ?? [])
				.sort((a: any, b: any) => a.order_index - b.order_index)
				.map((ch: any) => ({
					...ch,
					options: (ch.options ?? []).sort((a: any, b: any) => a.order_index - b.order_index),
				}));

			return res.json({ success: true, data: { case: plain } });
		} catch (e) {
			console.error('Virus getCase error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка загрузки случая' });
		}
	}

	// POST /virus/cases/:caseId/chapters/:chapterId/answer
	async submitAnswer(req: Request, res: Response) {
		try {
			const chapterId = Number(req.params.chapterId);
			const { optionId } = req.body as { optionId?: number; telegramId?: string | number };

			if (!optionId) return res.status(400).json({ success: false, message: 'optionId обязателен' });

			// Verify option belongs to this chapter
			const option = await VirusChapterOption.findOne({ where: { id: optionId, chapter_id: chapterId } });
			if (!option) return res.status(404).json({ success: false, message: 'Вариант не найден' });

			// Find the correct option for this chapter
			const correctOption = await VirusChapterOption.findOne({ where: { chapter_id: chapterId, is_correct: true } });

			return res.json({
				success: true,
				data: {
					is_correct: option.is_correct,
					consequence_text: option.consequence_text,
					correct_option_id: correctOption?.id ?? option.id,
				},
			});
		} catch (e) {
			console.error('Virus submitAnswer error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка проверки ответа' });
		}
	}

	// POST /virus/cases/:id/complete
	async complete(req: Request, res: Response) {
		try {
			const case_id = Number(req.params.id);
			const { correct_answers, total_chapters } = req.body as {
				correct_answers?: number;
				total_chapters?: number;
				telegramId?: string | number;
			};

			const user = await resolveUser(req);
			if (!user) return res.status(401).json({ success: false, message: 'Требуется авторизация' });

			const virusCase = await VirusCase.findByPk(case_id, { raw: true });
			if (!virusCase) return res.status(404).json({ success: false, message: 'Случай не найден' });

			const corrAns = Number(correct_answers ?? 0);
			const totalCh = Number(total_chapters ?? 1);
			const score = totalCh > 0 ? Math.round((corrAns / totalCh) * 100) : 0;
			const is_passed = score >= 50;

			const existing = await VirusResult.findOne({ where: { user_id: user.id, case_id } });
			let coinsToAdd = 0;
			const wasCompleted = existing?.is_completed ?? false;

			if (!existing) {
				coinsToAdd = is_passed ? virusCase.coins_reward : 0;
				await VirusResult.create({
					user_id: user.id,
					case_id,
					score,
					clues_used: totalCh,
					correct_answers: corrAns,
					coins_earned: coinsToAdd,
					is_completed: true,
					completed_at: new Date(),
				});
			} else if (!wasCompleted) {
				coinsToAdd = is_passed ? virusCase.coins_reward : 0;
				await existing.update({
					score,
					clues_used: totalCh,
					correct_answers: corrAns,
					coins_earned: coinsToAdd,
					is_completed: true,
					completed_at: new Date(),
				});
			} else {
				// Re-attempt: update score/answers but no extra coins
				await existing.update({ score, clues_used: totalCh, correct_answers: corrAns });
			}

			if (coinsToAdd > 0) {
				await user.update({ coins: Number(user.coins) + coinsToAdd });
				await WalletTransaction.create({
					user_id: user.id,
					type: 'credit',
					amount: coinsToAdd,
					source: 'virus',
					meta: { case_id },
				});
			}

			return res.json({
				success: true,
				data: {
					coins_earned: coinsToAdd,
					score,
					is_passed,
					correct_answers: corrAns,
					total_chapters: totalCh,
				},
			});
		} catch (e) {
			console.error('Virus complete error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сохранения результата' });
		}
	}
}

export const virusController = new VirusController();
