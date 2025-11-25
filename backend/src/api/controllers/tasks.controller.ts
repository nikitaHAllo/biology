import { Request, Response } from 'express';
import {
	DownloadableTask,
	TaskCollection,
	TaskCollectionItem,
} from '../../models';

function asNumber(value: unknown): number | undefined {
	if (value === null || value === undefined) return undefined;
	const numeric = Number(value);
	return Number.isNaN(numeric) ? undefined : numeric;
}

class TasksController {
	async listDownloads(_req: Request, res: Response) {
		try {
			const [tasks, collections] = await Promise.all([
				DownloadableTask.findAll({
					order: [['created_at', 'DESC']],
				}),
				TaskCollection.findAll({
					order: [['created_at', 'DESC']],
					include: [
						{
							model: DownloadableTask,
							as: 'tasks',
							through: {
								attributes: ['order_index'],
							},
						},
						{
							model: TaskCollectionItem,
							as: 'items',
						},
					],
				}),
			]);

			const formattedTasks = tasks.map(task => ({
				id: task.id,
				title: task.title,
				source: task.source,
				description: task.description,
				file_url: task.file_url,
				file_type: task.file_type,
				file_size: asNumber(task.file_size),
				year: task.year,
				subject: task.subject,
				created_at: task.created_at,
			}));

			const formattedCollections = collections.map(collection => {
				const tasksList =
					(collection.get('tasks') as DownloadableTask[] | undefined) || [];
				const orderMap = new Map<number, number>();

				const items =
					(collection.get('items') as TaskCollectionItem[] | undefined) || [];
				items.forEach(item => {
					orderMap.set(item.task_id, item.order_index);
				});

				const sortedTasks = [...tasksList].sort((a, b) => {
					const orderA = orderMap.get(a.id) ?? 0;
					const orderB = orderMap.get(b.id) ?? 0;
					return orderA - orderB;
				});

				return {
					id: collection.id,
					title: collection.title,
					source: collection.source,
					description: collection.description,
					total_tasks: sortedTasks.length,
					total_size:
						asNumber(collection.total_size) ??
						sortedTasks.reduce((sum, task) => {
							const size = asNumber(task.file_size) ?? 0;
							return sum + size;
						}, 0),
					tasks: sortedTasks.map(task => ({
						id: task.id,
						title: task.title,
						source: task.source,
						description: task.description,
						file_url: task.file_url,
						file_type: task.file_type,
						file_size: asNumber(task.file_size),
						year: task.year,
						subject: task.subject,
						created_at: task.created_at,
					})),
					created_at: collection.created_at,
				};
			});

			res.json({
				success: true,
				data: {
					tasks: formattedTasks,
					collections: formattedCollections,
				},
			});
		} catch (error) {
			console.error('Error fetching downloadable tasks:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось загрузить задания для скачивания',
			});
		}
	}
}

export const tasksController = new TasksController();


