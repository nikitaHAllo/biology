import { Router } from 'express';
import { usersController } from '../controllers/users.controller';

const router = Router();

// Все маршруты используют :telegramId как параметр
router.get('/:telegramId/profile', usersController.getProfile);
router.get('/:telegramId/transactions', usersController.getTransactionHistory);
router.get('/:telegramId/course-progress', usersController.getCourseProgress);
router.get('/:telegramId/achievements', usersController.getAchievements);
router.get('/:telegramId/balance', usersController.getBalance);
router.get('/:telegramId/stats', usersController.getStats);
router.patch('/:telegramId/profile', usersController.updateProfile);

export const usersRouter = router;
