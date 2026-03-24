import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken } from '../lib/authStorage';

/** Открытие из Telegram Mini App — не форсим веб-логин */
function isTelegramMiniAppSession(): boolean {
	if (typeof window === 'undefined') return false;
	const initData = window.Telegram?.WebApp?.initData;
	return typeof initData === 'string' && initData.length > 0;
}

/**
 * Корень `/`: в обычном браузере без JWT → на страницу входа;
 * с токеном или из Telegram Mini App → каталог `/home`.
 */
export const RootRedirect: React.FC = () => {
	if (getAuthToken()) {
		return <Navigate to='/home' replace />;
	}
	if (isTelegramMiniAppSession()) {
		return <Navigate to='/home' replace />;
	}
	return <Navigate to='/login' replace />;
};
