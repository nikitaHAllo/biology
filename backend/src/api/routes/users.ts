import express from 'express';
import { usersService } from '../../features/users.service';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { telegram_id, username } = req.body;
    if (!telegram_id) return res.status(400).json({ error: 'telegram_id is required' });
    const user = await usersService.registerOrUpdate(telegram_id, username);
    res.json(user);
  } catch (e) { next(e as Error); }
});

router.get('/:telegram_id', async (req, res, next) => {
  try {
    const user = await usersService.getByTelegramId(req.params.telegram_id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (e) { next(e as Error); }
});

router.post('/:telegram_id/coins', async (req, res, next) => {
  try {
    const result = await usersService.adjustCoins(req.params.telegram_id, Number(req.body.delta || 0));
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (e) { next(e as Error); }
});

router.get('/:telegram_id/profile', async (req, res, next) => {
  try {
    const data = await usersService.profile(req.params.telegram_id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e) { next(e as Error); }
});

export const usersRouter = router;
