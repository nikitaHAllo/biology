import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// JWT / x-telegram-id — до маршрутов с :telegramId
router.get(
	'/me/profile',
	authenticateUser,
	usersController.getProfileMe.bind(usersController),
);
router.patch(
	'/me/profile',
	authenticateUser,
	usersController.updateProfileMe.bind(usersController),
);
router.get(
	'/me/stats',
	authenticateUser,
	usersController.getStatsMe.bind(usersController),
);
router.get(
	'/me/course-progress',
	authenticateUser,
	usersController.getCourseProgressMe.bind(usersController),
);
router.get(
	'/me/achievements',
	authenticateUser,
	usersController.getAchievementsMe.bind(usersController),
);
router.get(
	'/me/balance',
	authenticateUser,
	usersController.getBalanceMe.bind(usersController),
);

// Telegram / legacy — :telegramId
router.get('/:telegramId/profile', usersController.getProfile.bind(usersController));
router.get(
	'/:telegramId/transactions',
	usersController.getTransactionHistory.bind(usersController),
);
router.get(
	'/:telegramId/course-progress',
	usersController.getCourseProgress.bind(usersController),
);
router.get(
	'/:telegramId/achievements',
	usersController.getAchievements.bind(usersController),
);
router.get('/:telegramId/balance', usersController.getBalance.bind(usersController));
router.get('/:telegramId/stats', usersController.getStats.bind(usersController));
router.patch(
	'/:telegramId/profile',
	usersController.updateProfile.bind(usersController),
);

export const usersRouter = router;
