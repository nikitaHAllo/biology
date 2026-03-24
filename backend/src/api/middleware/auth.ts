import { Request, Response, NextFunction } from 'express';
import { User } from '../../models';
import { verifyAccessToken } from '../../utils/jwt';

// Расширяем тип Request для добавления user
declare global {
	namespace Express {
		interface Request {
			user?: User;
		}
	}
}

export const authenticateUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.headers.authorization;
		if (authHeader?.startsWith('Bearer ')) {
			const token = authHeader.slice(7).trim();
			try {
				const payload = verifyAccessToken(token);
				const user = await User.findByPk(payload.sub);
				if (!user) {
					return res.status(401).json({
						success: false,
						message: 'Пользователь не найден',
					});
				}
				req.user = user;
				return next();
			} catch {
				return res.status(401).json({
					success: false,
					message: 'Недействительный или просроченный токен',
				});
			}
		}

		const telegramId = req.headers['x-telegram-id'] as string | undefined;

		if (telegramId) {
			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			req.user = user;
			return next();
		}

		return res.status(401).json({
			success: false,
			message: 'Требуется аутентификация',
		});
	} catch (error) {
		console.error('Authentication error:', error);
		res.status(500).json({
			success: false,
			message: 'Ошибка аутентификации',
		});
	}
};

export const optionalAuth = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.headers.authorization;
		if (authHeader?.startsWith('Bearer ')) {
			const token = authHeader.slice(7).trim();
			try {
				const payload = verifyAccessToken(token);
				const user = await User.findByPk(payload.sub);
				if (user) {
					req.user = user;
				}
			} catch {
				// игнорируем битый токен в optional режиме
			}
			return next();
		}

		const telegramId = req.headers['x-telegram-id'] as string | undefined;

		if (telegramId) {
			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (user) {
				req.user = user;
			}
		}

		next();
	} catch (error) {
		console.error('Optional auth error:', error);
		next();
	}
};
