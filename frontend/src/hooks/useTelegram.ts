import { useContext } from 'react';
import { TelegramContext } from '../contexts/TelegramContext';
import type { TelegramContextType } from '../types/context';

export const useTelegram = (): TelegramContextType => {
	const context = useContext(TelegramContext);
	if (context === undefined) {
		throw new Error('useTelegram must be used within a TelegramProvider');
	}
	return context;
};
