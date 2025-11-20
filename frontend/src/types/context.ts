import type { TelegramThemeParams, TelegramUser, TelegramWebApp } from "../models/telegram";


export interface TelegramContextType {
	user: TelegramUser | null;
	webApp: TelegramWebApp | null;
	isLoading: boolean;
	colorScheme: 'light' | 'dark';
	themeParams: TelegramThemeParams;
}