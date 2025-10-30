import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const api = {
	// Здесь будут методы для работы с API
	getQuestions: () => axios.get(`${API_URL}/questions`),
	getUserProfile: (userId: string) => axios.get(`${API_URL}/users/${userId}`),
	registerUser: (payload: {
		telegram_id: string | number;
		username?: string;
	}) => axios.post(`${API_URL}/users/register`, payload),
	adjustCoins: (telegramId: string | number, delta: number) =>
		axios.post(`${API_URL}/users/${telegramId}/coins`, { delta }),
	// ... другие методы
};
