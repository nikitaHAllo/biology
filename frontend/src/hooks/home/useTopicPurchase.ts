import { useState, useCallback } from 'react';

import { showNotification } from '@mantine/notifications';
import { apiService } from '../../api';
import type { Topic } from '../../models';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
	success: boolean;
	message: string;
	data?: {
		shortage?: number;
	};
}

export function useTopicPurchase() {
	const [purchasingTopicId, setPurchasingTopicId] = useState<number | null>(
		null
	);

	// Функция покупки темы
	const purchaseTopic = useCallback(
		async (
			telegramId: number | undefined,
			topic: Topic,
			onSuccess?: (newBalance: number) => void
		) => {
			try {
				setPurchasingTopicId(topic.id);

				// Покупаем тему
				const result = await apiService.purchaseTopic(telegramId, topic.id);

				if (result.is_purchased) {
					showNotification({
						title: 'Успешно!',
						message: `Тема "${topic.title}" куплена`,
						color: 'teal',
					});

					// Вызываем колбэк успеха
					if (onSuccess) {
						onSuccess(result.new_balance);
					}

					return true;
				} else {
					showNotification({
						title: 'Ошибка',
						message: 'Не удалось купить тему',
						color: 'red',
					});
					return false;
				}
			} catch (error: unknown) {
				console.error('Error purchasing topic:', error);

				// Проверяем, является ли ошибка AxiosError
				if (error instanceof AxiosError) {
					const errorData = error.response?.data as ApiErrorResponse;

					// Обработка специфичных ошибок
					if (errorData?.message === 'Недостаточно репкоинов') {
						showNotification({
							title: 'Недостаточно средств',
							message: `Нужно еще ${
								errorData.data?.shortage || topic.price_repcoins
							} репкоинов`,
							color: 'yellow',
						});
					} else if (errorData?.message === 'Тема уже куплена') {
						showNotification({
							title: 'Уже куплено',
							message: 'Эта тема уже доступна',
							color: 'blue',
						});
						return true; // Возвращаем true, так как доступ уже есть
					} else {
						showNotification({
							title: 'Ошибка',
							message: errorData?.message || 'Не удалось купить тему',
							color: 'red',
						});
					}
				} else {
					// Если это не AxiosError
					showNotification({
						title: 'Ошибка',
						message: 'Произошла неизвестная ошибка',
						color: 'red',
					});
				}

				return false;
			} finally {
				setPurchasingTopicId(null);
			}
		},
		[]
	);

	return {
		purchaseTopic,
		purchasingTopicId,
	};
}
