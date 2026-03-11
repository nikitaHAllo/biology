import React, { useEffect, useState, type ReactNode } from 'react';
import { TelegramContext } from '../contexts/TelegramContext';
import type {
	TelegramUser,
	TelegramWebApp,
	TelegramThemeParams,
} from '../models/telegram';
import { type TelegramContextType } from '../types/context';

interface TelegramProviderProps {
	children: ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({
	children,
}) => {
	const [user, setUser] = useState<TelegramUser | null>(null);
	const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
	const [themeParams, setThemeParams] = useState<TelegramThemeParams>({});

	useEffect(() => {
		const tg = window.Telegram?.WebApp;
		if (tg) {
			setWebApp(tg);

			if (tg.themeParams) setThemeParams(tg.themeParams);
			if (tg.colorScheme) setColorScheme(tg.colorScheme);

			tg.ready();
			tg.expand();
		}

		// Пользователь из Telegram или fallback для локальной разработки
		const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
		if (tgUser?.id) {
			setUser(tgUser);
		} else {
			// SDK не передал пользователя — используем dev-аккаунт
			setUser({
				id: 2110078216,
				first_name: 'Dev',
				username: 'dev_user',
				photo_url: '',
			});
		}

		setIsLoading(false);
	}, []);

	const contextValue: TelegramContextType = {
		user,
		webApp,
		isLoading,
		colorScheme,
		themeParams,
	};

	return (
		<TelegramContext.Provider value={contextValue}>
			{children}
		</TelegramContext.Provider>
	);
};
