import { Router } from 'express';
import { materialsController } from '../controllers/materials.controller';

const router = Router();

router.get('/catalog', (req, res) => materialsController.getCatalog(req, res));
router.post('/topics/:topicId/purchase', (req, res) =>
	materialsController.purchaseTopic(req, res)
);

export { router as materialsRouter };


