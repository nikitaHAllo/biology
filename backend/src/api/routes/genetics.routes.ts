import { Router } from 'express';
import { geneticsController } from '../controllers/genetics.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/scenarios', optionalAuth, (req, res) => geneticsController.list(req, res));
router.get('/scenarios/:id', (req, res) => geneticsController.getScenario(req, res));
router.post('/scenarios/:id/complete', optionalAuth, (req, res) => geneticsController.complete(req, res));

export { router as geneticsRouter };
