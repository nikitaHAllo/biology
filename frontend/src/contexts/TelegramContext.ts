import { createContext } from 'react';
import type { TelegramContextType } from '../types/context';

export const TelegramContext = createContext<TelegramContextType | undefined>(
	undefined
);
