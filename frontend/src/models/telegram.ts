export interface TelegramUser {
	id: number;
	first_name: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
	language_code?: string;
}

export interface TelegramMainButton {
	text: string;
	color: string;
	textColor: string;
	isVisible: boolean;
	isActive: boolean;
	show: () => void;
	hide: () => void;
	setText: (text: string) => void;
	onClick: (callback: () => void) => void;
}

export interface TelegramThemeParams {
	bg_color?: string;
	text_color?: string;
	hint_color?: string;
	link_color?: string;
	button_color?: string;
	button_text_color?: string;
	secondary_bg_color?: string;
}

export interface TelegramWebApp {
	initDataUnsafe: {
		user: TelegramUser;
		query_id?: string;
	};
	themeParams: TelegramThemeParams;
	colorScheme: 'light' | 'dark';
	ready: () => void;
	expand: () => void;
	close: () => void;
	MainButton: TelegramMainButton;
}

declare global {
	interface Window {
		Telegram: {
			WebApp: TelegramWebApp;
		};
	}
}

