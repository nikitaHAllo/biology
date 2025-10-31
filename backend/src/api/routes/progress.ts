import express from 'express';
import { usersService } from '../../features/users.service';

const router = express.Router();

router.get('/:telegram_id', async (req, res, next) => {
  try {
    const data = await usersService.profile(req.params.telegram_id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e) { next(e as Error); }
});

export const progressRouter = router;
