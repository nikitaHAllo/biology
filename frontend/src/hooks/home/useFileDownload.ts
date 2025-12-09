import { useState } from 'react';
import type { TopicFile } from '../../models/material';


export function useFileDownload() {
	const [downloading, setDownloading] = useState<string | null>(null);

	const downloadFile = async (file: TopicFile) => {
		try {
			setDownloading(file.id.toString());

			// Вариант A: Простое скачивание (если CORS разрешено)
			// window.location.href = file.file_url;

			// Вариант B: Используем fetch для скачивания
			const response = await fetch(file.file_url);

			if (!response.ok) {
				throw new Error(`Ошибка HTTP: ${response.status}`);
			}

			// Получаем данные как Blob
			const blob = await response.blob();

			// Создаем URL для скачивания
			const url = window.URL.createObjectURL(blob);

			// Создаем временную ссылку для скачивания
			const a = document.createElement('a');
			a.href = url;
			a.download = file.name + '.' + file.file_type; // Имя файла для сохранения

			// Добавляем в DOM, кликаем и удаляем
			document.body.appendChild(a);
			a.click();

			// Очищаем ресурсы
			setTimeout(() => {
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			}, 100);
		} catch (error) {
			console.error('Ошибка при скачивании файла:', error);
			alert('Не удалось скачать файл. Попробуйте еще раз.');
		} finally {
			setDownloading(null);
		}
	};

	return { downloadFile, downloading };
}
