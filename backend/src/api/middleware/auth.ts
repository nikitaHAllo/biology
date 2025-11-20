import { Request, Response, NextFunction } from 'express';
import { User } from '../../models';

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
		const telegramId = req.headers['x-telegram-id'] as string;

		if (!telegramId) {
			return res.status(401).json({
				success: false,
				message: 'Требуется аутентификация',
			});
		}

		const user = await User.findOne({
			where: { telegram_id: telegramId },
		});

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'Пользователь не найден',
			});
		}

		// Добавляем пользователя в запрос
		req.user = user;
		next();
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
		const telegramId = req.headers['x-telegram-id'] as string;

		if (telegramId) {
			const user = await User.findOne({
				where: { telegram_id: telegramId },
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
