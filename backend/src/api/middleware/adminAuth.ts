import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-only-change-me-in-production';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
	const header = req.headers.authorization;
	if (!header?.startsWith('Bearer ')) {
		return res.status(401).json({ success: false, message: 'Требуется авторизация' });
	}
	try {
		const payload = jwt.verify(header.slice(7), SECRET) as { role?: string };
		if (payload.role !== 'admin') throw new Error('not admin');
		next();
	} catch {
		res.status(401).json({ success: false, message: 'Недействительный токен' });
	}
}
