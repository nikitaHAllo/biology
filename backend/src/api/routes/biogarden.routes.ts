// routes/biogarden.routes.ts
import { Router } from 'express';
import { biogardenController } from '../controllers/biogarden.controller';
import { bioGardenReadinessController } from '../controllers/biogarden-readiness.controller';


const router = Router();

// Получение списка растений
router.get('/plants', (req, res) => biogardenController.getPlants(req, res));

// Начать выращивание растения
router.post('/plants/:plantId/start', (req, res) =>
	biogardenController.startPlant(req, res),
);

// Получить вопрос для текущей стадии
router.get('/plants/:plantId/current-question', (req, res) =>
	biogardenController.getCurrentQuestion(req, res),
);

// Ответить на вопрос
router.post('/plants/:plantId/answer', (req, res) =>
	biogardenController.submitAnswer(req, res),
);

// Полить растение (восстановить здоровье)
router.post('/plants/:plantId/water', (req, res) =>
	biogardenController.waterPlant(req, res),
);

// Реанимация завядшего растения: за монеты или вопрос
router.post('/plants/:plantId/revive', (req, res) =>
	biogardenController.revive(req, res),
);
// Вопрос для реанимации (уровень ЕГЭ часть B)
router.get('/plants/:plantId/revive-question', (req, res) =>
	biogardenController.getReviveQuestion(req, res),
);
// Ответ на вопрос реанимации
router.post('/plants/:plantId/revive-answer', (req, res) =>
	biogardenController.reviveAnswer(req, res),
);

// Получить прогресс пользователя
router.get('/progress', (req, res) =>
	biogardenController.getProgress(req, res),
);

// Получить детали конкретного растения пользователя
router.get('/plants/:plantId/progress', (req, res) =>
	biogardenController.getPlantProgress(req, res),
);

// Получить статистику
router.get('/stats', (req, res) => biogardenController.getStats(req, res));

// Готовность к ЕГЭ по темам
router.get('/ege-readiness', (req, res) =>
	bioGardenReadinessController.getEgeReadiness(req, res),
);

export { router as biogardenRouter };
