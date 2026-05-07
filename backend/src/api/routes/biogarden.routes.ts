// routes/biogarden.routes.ts
import { Router } from 'express';
import { biogardenController } from '../controllers/biogarden.controller';
import { bioGardenReadinessController } from '../controllers/biogarden-readiness.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/plants', optionalAuth, (req, res) => biogardenController.getPlants(req, res));
router.post('/plants/:plantId/start', optionalAuth, (req, res) => biogardenController.startPlant(req, res));
router.get('/plants/:plantId/current-question', optionalAuth, (req, res) => biogardenController.getCurrentQuestion(req, res));
router.post('/plants/:plantId/answer', optionalAuth, (req, res) => biogardenController.submitAnswer(req, res));
router.post('/plants/:plantId/water', optionalAuth, (req, res) => biogardenController.waterPlant(req, res));
router.post('/plants/:plantId/revive', optionalAuth, (req, res) => biogardenController.revive(req, res));
router.get('/plants/:plantId/revive-question', optionalAuth, (req, res) => biogardenController.getReviveQuestion(req, res));
router.post('/plants/:plantId/revive-answer', optionalAuth, (req, res) => biogardenController.reviveAnswer(req, res));
router.get('/progress', optionalAuth, (req, res) => biogardenController.getProgress(req, res));
router.get('/plants/:plantId/progress', optionalAuth, (req, res) => biogardenController.getPlantProgress(req, res));
router.get('/stats', optionalAuth, (req, res) => biogardenController.getStats(req, res));
router.get('/ege-readiness', optionalAuth, (req, res) => bioGardenReadinessController.getEgeReadiness(req, res));

export { router as biogardenRouter };
