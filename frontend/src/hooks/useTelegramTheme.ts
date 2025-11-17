import { useTelegram } from './useTelegram';

export const useTelegramTheme = () => {
	const { colorScheme, themeParams } = useTelegram();

	// Функция для получения цветов из themeParams или fallback
	const getThemeColor = (
		colorKey: keyof typeof themeParams,
		fallback: string
	) => {
		return themeParams[colorKey] || fallback;
	};

	return {
		colorScheme,
		themeParams,
		getThemeColor,
		isDark: colorScheme === 'dark',
		isLight: colorScheme === 'light',
	};
};
