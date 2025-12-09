import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

class DownloadsController {
	// Метод для скачивания файла
	async downloadFile(req: Request, res: Response) {
		try {
			const { filename } = req.params;

			// Проверяем, что filename передан
			if (!filename) {
				return res.status(400).json({
					success: false,
					message: 'Имя файла не указано',
				});
			}

			// Защита от path traversal атак
			const sanitizedFilename = path.basename(filename);
			const filePath = path.join(__dirname, '../../uploads', sanitizedFilename);
            console.log(filePath);

			// Проверяем существование файла
			if (!fs.existsSync(filePath)) {
				return res.status(404).json({
					success: false,
					message: 'Файл не найден',
				});
			}

			// Определяем MIME-тип файла
			const ext = path.extname(sanitizedFilename).toLowerCase();
			const mimeTypes: Record<string, string> = {
				'.pdf': 'application/pdf',
				'.docx':
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'.doc': 'application/msword',
				'.zip': 'application/zip',
				'.txt': 'text/plain',
				'.jpg': 'image/jpeg',
				'.jpeg': 'image/jpeg',
				'.png': 'image/png',
			};

			const mimeType = mimeTypes[ext] || 'application/octet-stream';

			// Устанавливаем заголовки для скачивания
			res.setHeader('Content-Type', mimeType);
			res.setHeader(
				'Content-Disposition',
				`attachment; filename="${sanitizedFilename}"`
			);

			// Отправляем файл
			const fileStream = fs.createReadStream(filePath);
			fileStream.pipe(res);
		} catch (error) {
			console.error('Error downloading file:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при скачивании файла',
			});
		}
	}

	// Метод для получения информации о файле
	async getFileInfo(req: Request, res: Response) {
		try {
			const { filename } = req.params;

			// Проверяем, что filename передан
			if (!filename) {
				return res.status(400).json({
					success: false,
					message: 'Имя файла не указано',
				});
			}

			// Защита от path traversal атак
			const sanitizedFilename = path.basename(filename);
			const filePath = path.join(__dirname, '../../uploads', sanitizedFilename);

			if (!fs.existsSync(filePath)) {
				return res.status(404).json({
					success: false,
					message: 'Файл не найден',
				});
			}

			const stats = fs.statSync(filePath);
			const ext = path.extname(sanitizedFilename).toLowerCase();

			res.json({
				success: true,
				data: {
					filename: sanitizedFilename,
					size: stats.size,
					sizeMb: (stats.size / (1024 * 1024)).toFixed(1),
					created: stats.birthtime,
					modified: stats.mtime,
					extension: ext.replace('.', ''),
				},
			});
		} catch (error) {
			console.error('Error getting file info:', error);
			res.status(500).json({
				success: false,
				message: 'Ошибка при получении информации о файле',
			});
		}
	}
}

export const downloadsController = new DownloadsController();
