import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret =
	process.env.JWT_SECRET || 'dev-only-change-me-in-production';
const JWT_EXPIRES_IN: NonNullable<SignOptions['expiresIn']> =
	(process.env.JWT_EXPIRES_IN || '7d') as NonNullable<SignOptions['expiresIn']>;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
	console.warn(
		'⚠️  JWT_SECRET не задан в production — задайте переменную окружения.',
	);
}

export interface AccessTokenPayload {
	sub: number;
	typ: 'access';
}

export function signAccessToken(userId: number): string {
	const payload: AccessTokenPayload = { sub: userId, typ: 'access' };
	const opts: SignOptions = { expiresIn: JWT_EXPIRES_IN };
	return jwt.sign(payload, JWT_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
	const decoded = jwt.verify(token, JWT_SECRET) as unknown as AccessTokenPayload;
	if (decoded.typ !== 'access' || typeof decoded.sub !== 'number') {
		throw new Error('Invalid token payload');
	}
	return decoded;
}
