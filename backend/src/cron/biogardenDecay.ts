/**
 * Ежедневный decay HP для растений Биосада (00:00).
 * Не практиковался 1 день → -5 HP; 3 дня → -8 HP/день; 7+ дней → -12 HP/день.
 * Растения в revive_sleep_until не трогаем.
 */
import cron from 'node-cron';
import { UserBioGardenProgress } from '../models';
import { Op } from 'sequelize';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getDecayPerDay(daysSincePractice: number): number {
	if (daysSincePractice < 1) return 0;
	if (daysSincePractice <= 2) return 5;
	if (daysSincePractice <= 6) return 8;
	return 12;
}

export async function runBiogardenDecay(): Promise<void> {
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	const progressList = await UserBioGardenProgress.findAll({
		where: {
			is_completed: false,
			is_wilted: false,
			[Op.or]: [
				{ revive_sleep_until: null },
				{ revive_sleep_until: { [Op.lt]: now } },
			],
		},
	});

	for (const p of progressList) {
		const refDate = p.last_practiced_at || p.planted_at;
		const ref = refDate ? new Date(refDate) : new Date(p.planted_at);
		const daysSince = Math.floor(
			(todayStart.getTime() - ref.getTime()) / MS_PER_DAY,
		);
		if (daysSince < 1) continue;

		const decayPerDay = getDecayPerDay(daysSince);
		const newHp = Math.max(0, (p.health_points ?? 100) - decayPerDay);

		p.health_points = newHp;
		p.last_decay_at = now;
		if (newHp <= 0) {
			p.is_wilted = true;
			p.is_unlocked = false;
		}
		await p.save();
	}
}

export function startBiogardenDecayCron(): void {
	// Каждый день в 00:00 по локальному времени сервера
	cron.schedule('0 0 * * *', async () => {
		try {
			await runBiogardenDecay();
			console.log('[cron] biogarden decay executed');
		} catch (err) {
			console.error('[cron] biogarden decay failed:', err);
		}
	});
	console.log('[cron] biogarden decay scheduled (0 0 * * *)');
}
