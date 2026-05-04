import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../models';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export class AuthController {
	async register(req: Request, res: Response) {
		try {
			const emailRaw = req.body?.email as string | undefined;
			const password = req.body?.password as string | undefined;
			const username = (req.body?.username as string | undefined)?.trim() || null;

			if (!emailRaw || !password) {
				return res.status(400).json({ success: false, message: 'Укажите email и пароль' });
			}

			const email = normalizeEmail(emailRaw);
			if (!EMAIL_REGEX.test(email)) {
				return res.status(400).json({ success: false, message: 'Некорректный email' });
			}

			if (password.length < 8) {
				return res.status(400).json({ success: false, message: 'Пароль должен быть не короче 8 символов' });
			}

			const existing = await User.findOne({ where: { email } });
			if (existing) {
				return res.status(409).json({ success: false, message: 'Пользователь с таким email уже зарегистрирован' });
			}

			const password_hash = await bcrypt.hash(password, 10);

			const user = await User.create({
				email,
				password_hash,
				username,
				telegram_id: null,
				coins: 0,
			});

			await user.reload();

			const userId = user.get('id') as number;

			return res.status(201).json({
				success: true,
				data: {
					accessToken: signAccessToken(userId),
					refreshToken: signRefreshToken(userId),
					user: {
						id: userId,
						email: user.get('email'),
						telegram_id: user.get('telegram_id'),
						username: user.get('username'),
						coins: user.get('coins'),
					},
				},
			});
		} catch (error) {
			console.error('Auth register error:', error);
			return res.status(500).json({ success: false, message: 'Ошибка регистрации' });
		}
	}

	async login(req: Request, res: Response) {
		try {
			const emailRaw = req.body?.email as string | undefined;
			const password = req.body?.password as string | undefined;

			if (!emailRaw || !password) {
				return res.status(400).json({ success: false, message: 'Укажите email и пароль' });
			}

			const email = normalizeEmail(emailRaw);

			const user = await User.findOne({
				where: { email },
				attributes: ['id', 'email', 'telegram_id', 'username', 'coins', 'password_hash'],
			});

			const storedHash = user?.get('password_hash') as string | null | undefined;

			if (!user || !storedHash) {
				return res.status(401).json({ success: false, message: 'Неверный email или пароль' });
			}

			const ok = await bcrypt.compare(password, storedHash);
			if (!ok) {
				return res.status(401).json({ success: false, message: 'Неверный email или пароль' });
			}

			const userId = user.get('id') as number;

			return res.json({
				success: true,
				data: {
					accessToken: signAccessToken(userId),
					refreshToken: signRefreshToken(userId),
					user: {
						id: userId,
						email: user.get('email'),
						telegram_id: user.get('telegram_id'),
						username: user.get('username'),
						coins: user.get('coins'),
					},
				},
			});
		} catch (error) {
			console.error('Auth login error:', error);
			return res.status(500).json({ success: false, message: 'Ошибка входа' });
		}
	}

	async refresh(req: Request, res: Response) {
		try {
			const token = req.body?.refreshToken as string | undefined;
			if (!token) {
				return res.status(400).json({ success: false, message: 'Требуется refreshToken' });
			}

			let payload;
			try {
				payload = verifyRefreshToken(token);
			} catch {
				return res.status(401).json({ success: false, message: 'Недействительный или просроченный refresh токен' });
			}

			const user = await User.findByPk(payload.sub);
			if (!user) {
				return res.status(401).json({ success: false, message: 'Пользователь не найден' });
			}

			const userId = user.get('id') as number;

			return res.json({
				success: true,
				data: {
					accessToken: signAccessToken(userId),
					refreshToken: signRefreshToken(userId),
				},
			});
		} catch (error) {
			console.error('Auth refresh error:', error);
			return res.status(500).json({ success: false, message: 'Ошибка обновления токена' });
		}
	}

	async me(req: Request, res: Response) {
		try {
			const user = req.user;
			if (!user) {
				return res.status(401).json({ success: false, message: 'Требуется авторизация' });
			}

			return res.json({
				success: true,
				data: {
					user: {
						id: user.get('id') as number,
						email: user.get('email'),
						telegram_id: user.get('telegram_id'),
						username: user.get('username'),
						coins: user.get('coins'),
						created_at: user.get('created_at'),
					},
				},
			});
		} catch (error) {
			console.error('Auth me error:', error);
			return res.status(500).json({ success: false, message: 'Ошибка' });
		}
	}
}

export const authController = new AuthController();
