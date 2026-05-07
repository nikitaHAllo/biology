import { Router } from 'express';
import { virusController } from '../controllers/virus.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/cases', optionalAuth, (req, res) => virusController.list(req, res));
router.get('/cases/:id', (req, res) => virusController.getCase(req, res));
router.post('/cases/:id/guess', (req, res) => virusController.guess(req, res));
router.post('/cases/:id/complete', optionalAuth, (req, res) => virusController.complete(req, res));

export { router as virusRouter };
