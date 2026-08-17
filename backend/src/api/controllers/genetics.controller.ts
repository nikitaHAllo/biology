import { Request, Response } from 'express';
import { GeneticScenario, GeneticStep, GeneticOption, GeneticResult, User, WalletTransaction } from '../../models';

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

class GeneticsController {
	// GET /genetics/scenarios
	async list(req: Request, res: Response) {
		try {
			const scenarios = await GeneticScenario.findAll({
				where: { is_active: true },
				order: [['order_index', 'ASC'], ['created_at', 'ASC']],
				attributes: ['id', 'title', 'description', 'difficulty', 'coins_reward', 'order_index'],
			});

			const user = await resolveUser(req);
			if (!user) {
				return res.json({
					success: true,
					data: { scenarios: scenarios.map(s => ({ ...s.get({ plain: true }), is_completed: false, score: null })) },
				});
			}
			const userId = user.id;

			const results = await GeneticResult.findAll({ where: { user_id: userId }, raw: true });
			const resultMap = new Map(results.map(r => [r.scenario_id, r]));

			const formatted = scenarios.map(s => {
				const r = resultMap.get(s.id);
				return {
					...s.get({ plain: true }),
					is_completed: r?.is_completed ?? false,
					score: r?.score ?? null,
					coins_earned: r?.coins_earned ?? null,
				};
			});

			return res.json({ success: true, data: { scenarios: formatted } });
		} catch (e) {
			console.error('Genetics list error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка загрузки сценариев' });
		}
	}

	// GET /genetics/scenarios/:id
	async getScenario(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const scenario = await GeneticScenario.findByPk(id, {
				include: [{
					model: GeneticStep,
					as: 'steps',
					include: [{ model: GeneticOption, as: 'options' }],
				}],
			});

			if (!scenario) return res.status(404).json({ success: false, message: 'Сценарий не найден' });

			const plain = scenario.get({ plain: true }) as any;
			plain.steps = (plain.steps ?? [])
				.sort((a: any, b: any) => a.order_index - b.order_index)
				.map((step: any) => ({
					...step,
					options: (step.options ?? []).sort((a: any, b: any) => a.order_index - b.order_index),
				}));

			return res.json({ success: true, data: { scenario: plain } });
		} catch (e) {
			console.error('Genetics getScenario error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка загрузки сценария' });
		}
	}

	// POST /genetics/scenarios/:id/complete
	async complete(req: Request, res: Response) {
		try {
			const scenario_id = Number(req.params.id);
			const { score } = req.body as { score?: number; telegramId?: string | number };

			const user = await resolveUser(req);
			if (!user) return res.status(401).json({ success: false, message: 'Требуется авторизация' });
			const userId = user.id;

			const scenario = await GeneticScenario.findByPk(scenario_id, { raw: true });
			if (!scenario) return res.status(404).json({ success: false, message: 'Сценарий не найден' });

			const scoreNum = Number(score ?? 0);
			const existing = await GeneticResult.findOne({ where: { user_id: userId, scenario_id }, raw: true });

			let coinsToAdd = 0;

			if (!existing) {
				// First completion — always award coins
				coinsToAdd = scenario.coins_reward;
				await GeneticResult.create({
					user_id: userId,
					scenario_id,
					score: scoreNum,
					coins_earned: coinsToAdd,
					is_completed: true,
					completed_at: new Date(),
				});
			} else {
				// Replay — never award coins, just keep the best score
				if (scoreNum > Number(existing.score)) {
					await GeneticResult.update(
						{ score: scoreNum },
						{ where: { user_id: userId, scenario_id } }
					);
				}
			}

			if (coinsToAdd > 0) {
				await user.update({ coins: Number(user.coins) + coinsToAdd });
				await WalletTransaction.create({
					user_id: userId,
					type: 'credit',
					amount: coinsToAdd,
					source: 'genetics',
					meta: { scenario_id },
				});
			}

			return res.json({ success: true, data: { coins_earned: coinsToAdd, score: scoreNum } });
		} catch (e) {
			console.error('Genetics complete error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сохранения результата' });
		}
	}
}

export const geneticsController = new GeneticsController();
