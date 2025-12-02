import { Router } from 'express';
import { quizzesController } from '../controllers/quizzes.controller';

const router = Router();

router.get('/', (req, res) => quizzesController.list(req, res));
router.get('/:quizId', (req, res) => quizzesController.details(req, res));
router.post('/:quizId/complete', (req, res) =>
	quizzesController.complete(req, res)
);


export { router as quizzesRouter };


