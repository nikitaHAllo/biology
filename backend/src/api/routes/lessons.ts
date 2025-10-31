import { Router } from 'express';
import { usersService } from '../../features/users.service';

const router = Router();

// Регистрация или обновление пользователя
router.post('/register', async (req, res, next) => {
	try {
		const tgId: string = String(req.body.telegram_id);
		const username: string | undefined = req.body.username ?? undefined;

		if (!tgId)
			return res.status(400).json({ error: 'telegram_id is required' });

		const user = await usersService.registerOrUpdate(tgId, username);
		res.json(user);
	} catch (e) {
		next(e as Error);
	}
});

// Получение пользователя по Telegram ID
router.get('/:telegram_id', async (req, res, next) => {
	try {
		const user = await usersService.getByTelegramId(req.params.telegram_id);
		if (!user) return res.status(404).json({ error: 'Not found' });
		res.json(user);
	} catch (e) {
		next(e as Error);
	}
});

// Пополнение / списание репкоинов
router.post('/:telegram_id/coins', async (req, res, next) => {
	try {
		const delta: number = Number(req.body.delta || 0);
		const result = await usersService.adjustCoins(
			req.params.telegram_id,
			delta
		);
		if (!result) return res.status(404).json({ error: 'Not found' });
		res.json(result);
	} catch (e) {
		next(e as Error);
	}
});

// Получение профиля пользователя
router.get('/:telegram_id/profile', async (req, res, next) => {
	try {
		const profile = await usersService.profile(req.params.telegram_id);
		if (!profile) return res.status(404).json({ error: 'Not found' });
		res.json(profile);
	} catch (e) {
		next(e as Error);
	}
});

export const usersRouter = router;
