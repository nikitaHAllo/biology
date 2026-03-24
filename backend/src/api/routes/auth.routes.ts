import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/verify-email', (req, res) => authController.verifyEmail(req, res));
router.post('/resend-code', (req, res) =>
	authController.resendVerificationCode(req, res),
);
router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', authenticateUser, (req, res) => authController.me(req, res));

export const authRouter = router;
