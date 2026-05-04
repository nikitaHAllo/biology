import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

const ACCESS_SECRET: Secret = process.env.JWT_SECRET || 'dev-only-change-me-in-production';
const REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
	console.warn('⚠️  JWT_SECRET не задан в production — задайте переменную окружения.');
}

export interface AccessTokenPayload {
	sub: number;
	typ: 'access';
}

export interface RefreshTokenPayload {
	sub: number;
	typ: 'refresh';
}

export function signAccessToken(userId: number): string {
	const payload: AccessTokenPayload = { sub: userId, typ: 'access' };
	const opts: SignOptions = { expiresIn: '15m' };
	return jwt.sign(payload, ACCESS_SECRET, opts);
}

export function signRefreshToken(userId: number): string {
	const payload: RefreshTokenPayload = { sub: userId, typ: 'refresh' };
	const opts: SignOptions = { expiresIn: '30d' };
	return jwt.sign(payload, REFRESH_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
	const decoded = jwt.verify(token, ACCESS_SECRET) as unknown as AccessTokenPayload;
	if (decoded.typ !== 'access' || typeof decoded.sub !== 'number') {
		throw new Error('Invalid token payload');
	}
	return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
	const decoded = jwt.verify(token, REFRESH_SECRET) as unknown as RefreshTokenPayload;
	if (decoded.typ !== 'refresh' || typeof decoded.sub !== 'number') {
		throw new Error('Invalid token payload');
	}
	return decoded;
}
