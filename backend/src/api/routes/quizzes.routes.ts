import { Router } from 'express';
import { quizzesController } from '../controllers/quizzes.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/categories', (req, res) => quizzesController.getCategories(req, res));
router.get('/', optionalAuth, (req, res) => quizzesController.list(req, res));
router.get('/:quizId', (req, res) => quizzesController.details(req, res));
router.post('/:quizId/complete', optionalAuth, (req, res) =>
	quizzesController.complete(req, res)
);


export { router as quizzesRouter };


