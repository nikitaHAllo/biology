import { Request, Response } from 'express';
import { VirusCase, VirusClue, VirusSuspect, VirusResult, User, WalletTransaction } from '../../models';

class VirusController {
	// GET /virus/cases
	async list(req: Request, res: Response) {
		try {
			const cases = await VirusCase.findAll({
				where: { is_active: true },
				order: [['order_index', 'ASC'], ['created_at', 'ASC']],
				attributes: ['id', 'title', 'description', 'difficulty', 'coins_reward', 'order_index'],
			});

			const userId = (req as any).user?.id;
			if (!userId) {
				return res.json({
					success: true,
					data: { cases: cases.map(c => ({ ...c.get({ plain: true }), is_completed: false, score: null })) },
				});
			}

			const results = await VirusResult.findAll({ where: { user_id: userId }, raw: true });
			const resultMap = new Map(results.map(r => [r.case_id, r]));

			const formatted = cases.map(c => {
				const r = resultMap.get(c.id);
				return {
					...c.get({ plain: true }),
					is_completed: r?.is_completed ?? false,
					score: r?.score ?? null,
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
					{ model: VirusClue, as: 'clues' },
					{ model: VirusSuspect, as: 'suspects' },
				],
			});

			if (!virusCase) return res.status(404).json({ success: false, message: 'Случай не найден' });

			const plain = virusCase.get({ plain: true }) as any;
			plain.clues = (plain.clues ?? []).sort((a: any, b: any) => a.order_index - b.order_index);
			plain.suspects = (plain.suspects ?? []).sort((a: any, b: any) => a.order_index - b.order_index);

			// Hide is_correct from frontend
			plain.suspects = plain.suspects.map(({ is_correct: _hidden, ...s }: any) => s);

			return res.json({ success: true, data: { case: plain } });
		} catch (e) {
			console.error('Virus getCase error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка загрузки случая' });
		}
	}

	// POST /virus/cases/:id/guess  — check a suspect guess
	async guess(req: Request, res: Response) {
		try {
			const case_id = Number(req.params.id);
			const { suspect_id } = req.body as { suspect_id: number };

			const suspect = await VirusSuspect.findOne({ where: { id: suspect_id, case_id }, raw: true });
			if (!suspect) return res.status(404).json({ success: false, message: 'Подозреваемый не найден' });

			return res.json({
				success: true,
				data: {
					is_correct: suspect.is_correct,
					description: suspect.is_correct ? suspect.description : null,
				},
			});
		} catch (e) {
			console.error('Virus guess error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка проверки ответа' });
		}
	}

	// POST /virus/cases/:id/complete
	async complete(req: Request, res: Response) {
		try {
			const case_id = Number(req.params.id);
			const { clues_used } = req.body as { clues_used: number };
			const userId = (req as any).user?.id;

			if (!userId) return res.status(401).json({ success: false, message: 'Требуется авторизация' });

			const virusCase = await VirusCase.findByPk(case_id, { raw: true });
			if (!virusCase) return res.status(404).json({ success: false, message: 'Случай не найден' });

			const totalClues = await VirusClue.count({ where: { case_id } });
			const used = Math.max(0, Math.min(Number(clues_used ?? totalClues), totalClues));
			const score = totalClues > 0
				? Math.max(10, Math.round(((totalClues - used) / totalClues) * 100))
				: 100;

			const existing = await VirusResult.findOne({ where: { user_id: userId, case_id }, raw: true });
			let coinsToAdd = 0;

			if (!existing) {
				coinsToAdd = virusCase.coins_reward;
				await VirusResult.create({
					user_id: userId,
					case_id,
					score,
					clues_used: used,
					coins_earned: coinsToAdd,
					is_completed: true,
					completed_at: new Date(),
				});
			} else if (!existing.is_completed) {
				coinsToAdd = virusCase.coins_reward;
				await VirusResult.update(
					{ score, clues_used: used, coins_earned: coinsToAdd, is_completed: true, completed_at: new Date() },
					{ where: { user_id: userId, case_id } }
				);
			} else if (score > existing.score) {
				await VirusResult.update({ score, clues_used: used }, { where: { user_id: userId, case_id } });
			}

			if (coinsToAdd > 0) {
				const user = await User.findByPk(userId);
				if (user) {
					await user.update({ coins: Number(user.coins) + coinsToAdd });
					await WalletTransaction.create({
						user_id: userId,
						type: 'credit',
						amount: coinsToAdd,
						source: 'virus',
						meta: { case_id },
					});
				}
			}

			return res.json({ success: true, data: { coins_earned: coinsToAdd, score } });
		} catch (e) {
			console.error('Virus complete error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сохранения результата' });
		}
	}
}

export const virusController = new VirusController();
