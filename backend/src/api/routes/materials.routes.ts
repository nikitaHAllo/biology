import { Router } from 'express';
import { materialsController } from '../controllers/materials.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/catalog', optionalAuth, (req, res) => materialsController.getCatalog(req, res));
router.post('/topics/:topicId/purchase', optionalAuth, (req, res) =>
	materialsController.purchaseTopic(req, res)
);

router.get('/access/check', optionalAuth, (req, res) =>
	materialsController.checkTopicAccess(req, res)
);

export { router as materialsRouter };
