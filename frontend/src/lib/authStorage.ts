/** Ключ localStorage для JWT (веб-авторизация) */
export const AUTH_TOKEN_KEY = 'biology_auth_token';

export function getAuthToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
	localStorage.setItem(AUTH_TOKEN_KEY, token);
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new Event('biology-auth-changed'));
	}
}

export function clearAuthToken(): void {
	localStorage.removeItem(AUTH_TOKEN_KEY);
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new Event('biology-auth-changed'));
	}
}
