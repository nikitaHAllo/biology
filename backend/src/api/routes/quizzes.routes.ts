import { Router } from 'express';
import { quizzesController } from '../controllers/quizzes.controller';
import { openAnswersController } from '../controllers/openAnswers.controller';
import { optionalAuth, authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/categories', (req, res) => quizzesController.getCategories(req, res));
router.get('/', optionalAuth, (req, res) => quizzesController.list(req, res));
router.get('/:quizId', (req, res) => quizzesController.details(req, res));
router.post('/:quizId/complete', optionalAuth, (req, res) =>
	quizzesController.complete(req, res)
);

// Open-ended answers
router.post('/questions/:questionId/open-answer', authenticateUser, (req, res) => openAnswersController.submitAnswer(req, res));
router.get('/questions/:questionId/open-answer', authenticateUser, (req, res) => openAnswersController.getAnswer(req, res));
router.post('/open-answers/:id/request-review', authenticateUser, (req, res) => openAnswersController.requestReview(req, res));

export { router as quizzesRouter };


