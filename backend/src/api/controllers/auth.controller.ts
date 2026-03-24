import { randomInt } from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, WalletTransaction } from '../../models';
import { signAccessToken } from '../../utils/jwt';
import { sendEmailVerificationCode } from '../../services/email.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 15 * 60 * 1000;

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function generateSixDigitCode(): string {
	return String(randomInt(100000, 1000000));
}

export class AuthController {
	/** Регистрация: создаёт неподтверждённого пользователя и шлёт код на почту (токен не выдаётся). */
	async register(req: Request, res: Response) {
		try {
			const emailRaw = req.body?.email as string | undefined;
			const password = req.body?.password as string | undefined;
			const username = (req.body?.username as string | undefined)?.trim() || null;

			if (!emailRaw || !password) {
				return res.status(400).json({
					success: false,
					message: 'Укажите email и пароль',
				});
			}

			const email = normalizeEmail(emailRaw);
			if (!EMAIL_REGEX.test(email)) {
				return res.status(400).json({
					success: false,
					message: 'Некорректный email',
				});
			}

			if (password.length < 8) {
				return res.status(400).json({
					success: false,
					message: 'Пароль должен быть не короче 8 символов',
				});
			}

			const password_hash = await bcrypt.hash(password, 10);
			const plainCode = generateSixDigitCode();
			const codeHash = await bcrypt.hash(plainCode, 8);
			const expiresAt = new Date(Date.now() + CODE_TTL_MS);

			const existing = await User.findOne({ where: { email } });

			if (existing) {
				const verifiedAt = existing.get('email_verified_at') as Date | null;
				if (verifiedAt) {
					return res.status(409).json({
						success: false,
						message: 'Пользователь с таким email уже зарегистрирован',
					});
				}
				// Повторная подача до подтверждения — обновляем пароль и код
				await existing.update({
					password_hash,
					username: username ?? (existing.get('username') as string | null),
					email_verification_code_hash: codeHash,
					email_verification_expires_at: expiresAt,
				});
				await sendEmailVerificationCode(email, plainCode);
				return res.status(201).json({
					success: true,
					data: {
						needsVerification: true,
						email,
					},
				});
			}

			const user = await User.create({
				email,
				password_hash,
				username,
				telegram_id: null,
				coins: 0,
				email_verified_at: null,
				email_verification_code_hash: codeHash,
				email_verification_expires_at: expiresAt,
			});

			await user.reload();

			await sendEmailVerificationCode(email, plainCode);

			return res.status(201).json({
				success: true,
				data: {
					needsVerification: true,
					email: user.get('email') as string,
				},
			});
		} catch (error) {
			console.error('Auth register error:', error);
			return res.status(500).json({
				success: false,
				message: 'Ошибка регистрации',
			});
		}
	}

	/** Подтверждение кода с почты; после успеха — можно войти по паролю. */
	async verifyEmail(req: Request, res: Response) {
		try {
			const emailRaw = req.body?.email as string | undefined;
			const codeRaw = req.body?.code as string | undefined;

			if (!emailRaw || !codeRaw) {
				return res.status(400).json({
					success: false,
					message: 'Укажите email и код',
				});
			}

			const email = normalizeEmail(emailRaw);
			const code = String(codeRaw).trim().replace(/\s/g, '');

			if (!/^\d{6}$/.test(code)) {
				return res.status(400).json({
					success: false,
					message: 'Введите 6 цифр кода',
				});
			}

			const user = await User.findOne({
				where: { email },
				attributes: [
					'id',
					'email',
					'username',
					'telegram_id',
					'email_verified_at',
					'email_verification_code_hash',
					'email_verification_expires_at',
					'coins',
				],
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			if (user.get('email_verified_at')) {
				return res.status(400).json({
					success: false,
					message: 'Email уже подтверждён — войдите с паролем',
				});
			}

			const hash = user.get('email_verification_code_hash') as string | null;
			const exp = user.get('email_verification_expires_at') as Date | null;

			if (!hash || !exp) {
				return res.status(400).json({
					success: false,
					message: 'Запросите новый код',
				});
			}

			if (new Date() > new Date(exp)) {
				return res.status(400).json({
					success: false,
					message: 'Код истёк — запросите новый',
				});
			}

			const ok = await bcrypt.compare(code, hash);
			if (!ok) {
				return res.status(400).json({
					success: false,
					message: 'Неверный код',
				});
			}

			const userId = user.get('id') as number;
			const currentCoins = Number(user.get('coins') ?? 0);

			await user.update({
				email_verified_at: new Date(),
				email_verification_code_hash: null,
				email_verification_expires_at: null,
				coins: currentCoins + 10,
			});

			await WalletTransaction.create({
				user_id: userId,
				type: 'credit',
				amount: 10,
				source: 'welcome_bonus',
				meta: { reason: 'Приветственный бонус после подтверждения email' },
			});

			const token = signAccessToken(userId);

			return res.json({
				success: true,
				data: {
					token,
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
			console.error('Auth verifyEmail error:', error);
			return res.status(500).json({
				success: false,
				message: 'Ошибка подтверждения',
			});
		}
	}

	/** Повторная отправка кода на почту. */
	async resendVerificationCode(req: Request, res: Response) {
		try {
			const emailRaw = req.body?.email as string | undefined;
			if (!emailRaw) {
				return res.status(400).json({
					success: false,
					message: 'Укажите email',
				});
			}

			const email = normalizeEmail(emailRaw);

			const user = await User.findOne({ where: { email } });
			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			if (user.get('email_verified_at')) {
				return res.status(400).json({
					success: false,
					message: 'Email уже подтверждён',
				});
			}

			const plainCode = generateSixDigitCode();
			const codeHash = await bcrypt.hash(plainCode, 8);
			const expiresAt = new Date(Date.now() + CODE_TTL_MS);

			await user.update({
				email_verification_code_hash: codeHash,
				email_verification_expires_at: expiresAt,
			});

			await sendEmailVerificationCode(email, plainCode);

			return res.json({
				success: true,
				data: { message: 'Код отправлен повторно' },
			});
		} catch (error) {
			console.error('Auth resendVerificationCode error:', error);
			return res.status(500).json({
				success: false,
				message: 'Не удалось отправить код',
			});
		}
	}

	async login(req: Request, res: Response) {
		try {
			const emailRaw = req.body?.email as string | undefined;
			const password = req.body?.password as string | undefined;

			if (!emailRaw || !password) {
				return res.status(400).json({
					success: false,
					message: 'Укажите email и пароль',
				});
			}

			const email = normalizeEmail(emailRaw);

			const user = await User.findOne({
				where: { email },
				attributes: [
					'id',
					'email',
					'telegram_id',
					'username',
					'coins',
					'password_hash',
					'email_verified_at',
				],
			});

			const storedHash = user?.get('password_hash') as string | null | undefined;

			if (!user || !storedHash) {
				return res.status(401).json({
					success: false,
					message: 'Неверный email или пароль',
				});
			}

			const verifiedAt = user.get('email_verified_at') as Date | null;
			if (!verifiedAt) {
				return res.status(403).json({
					success: false,
					message: 'Сначала подтвердите email по коду из письма',
				});
			}

			const ok = await bcrypt.compare(password, storedHash);
			if (!ok) {
				return res.status(401).json({
					success: false,
					message: 'Неверный email или пароль',
				});
			}

			const userId = user.get('id') as number;
			const token = signAccessToken(userId);

			return res.json({
				success: true,
				data: {
					token,
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
			return res.status(500).json({
				success: false,
				message: 'Ошибка входа',
			});
		}
	}

	async me(req: Request, res: Response) {
		try {
			const user = req.user;
			if (!user) {
				return res.status(401).json({
					success: false,
					message: 'Требуется авторизация',
				});
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
			return res.status(500).json({
				success: false,
				message: 'Ошибка',
			});
		}
	}
}

export const authController = new AuthController();
