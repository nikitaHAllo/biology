import React, { useEffect, useState, type ReactNode } from 'react';
import { TelegramContext } from '../contexts/TelegramContext';
import type {
	TelegramUser,
	TelegramWebApp,
	TelegramThemeParams,
} from '../types/telegram';
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

			if (tg.initDataUnsafe?.user) {
				setUser(tg.initDataUnsafe.user);
			}

			// Получаем тему из Telegram
			if (tg.themeParams) {
				setThemeParams(tg.themeParams);
			}

			if (tg.colorScheme) {
				setColorScheme(tg.colorScheme);
			}

			tg.ready();
			tg.expand();
			setIsLoading(false);
		} else {
			// Для разработки вне Telegram
			setUser({
				id: 1053404914,
				first_name: 'Тестовый',
				username: 'test_user',
				photo_url: '',
			});
			setIsLoading(false);
		}
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
