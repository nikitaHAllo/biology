const ACCESS_TOKEN_KEY = 'biology_auth_token';
const REFRESH_TOKEN_KEY = 'biology_refresh_token';

function dispatch() {
	window.dispatchEvent(new Event('biology-auth-changed'));
}

export function getAuthToken(): string | null {
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
	return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
	localStorage.setItem(ACCESS_TOKEN_KEY, token);
	dispatch();
}

export function setRefreshToken(token: string): void {
	localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
	localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
	dispatch();
}

export function clearAuthToken(): void {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
	dispatch();
}

// backward-compat alias
export { ACCESS_TOKEN_KEY as AUTH_TOKEN_KEY };
