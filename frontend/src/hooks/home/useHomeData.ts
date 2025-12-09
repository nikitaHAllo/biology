import { useState, useEffect, useMemo } from 'react';
import { useTelegram } from '../useTelegram';
import { apiService } from '../../api';
import type { SectionWithTopics, Quiz, DownloadableTask } from '../../models';

interface UseHomeDataReturn {
	isLoading: boolean;
	error: string | null;
	sections: SectionWithTopics[];
	featuredQuiz: Quiz | null;
	filteredTasks: DownloadableTask[];
	collections: string[];
	selectedTasks: number[];
	taskFilter: string;
	setTaskFilter: (filter: string) => void;
	toggleTaskSelection: (taskId: number) => void;
	handleBulkDownload: () => void;
}

export const useHomeData = (): UseHomeDataReturn => {
	const { user } = useTelegram();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sections, setSections] = useState<SectionWithTopics[]>([]);
	const [quizzes, setQuizzes] = useState<Quiz[]>([]);
	const [tasks, setTasks] = useState<DownloadableTask[]>([]);
	const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
	const [taskFilter, setTaskFilter] = useState<string>('all');

	useEffect(() => {
		if (!user) return;

		const loadHomeData = async (): Promise<void> => {
			try {
				setIsLoading(true);
				setError(null);

				const [materialsData, quizzesData, tasksData] = await Promise.all([
					apiService.getMaterialsCatalog(user.id),
					apiService.getQuizzesList(user.id),
					apiService.getDownloadableTasks(),
				]);

				setSections(materialsData.sections);
				setQuizzes(quizzesData);
				setTasks(tasksData.tasks);
			} catch (err: unknown) {
				const errorMessage =
					err instanceof Error ? err.message : 'Не удалось загрузить данные';
				console.error('Error loading home data:', err);
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		loadHomeData();
	}, [user]);

	// Викторина с отметкой featured
	const featuredQuiz = useMemo(() => {
		return (
			quizzes.find((q: Quiz & { featured?: boolean }) => q.featured) ||
			quizzes[0] ||
			null
		);
	}, [quizzes]);

	// Фильтруем задачи по коллекции
	const filteredTasks = useMemo(() => {
		if (taskFilter === 'all') return tasks;
		return tasks.filter(
			(task: DownloadableTask & { collection?: string }) =>
				task.collection === taskFilter
		);
	}, [tasks, taskFilter]);

	// Собираем уникальные коллекции
	const collections = useMemo(() => {
		const uniqueCollections = new Set(
			tasks
				.map(
					(task: DownloadableTask & { collection?: string }) => task.collection
				)
				.filter(Boolean)
		);
		return Array.from(uniqueCollections) as string[];
	}, [tasks]);

	// Выбор/снятие выбора задач
	const toggleTaskSelection = (taskId: number) => {
		setSelectedTasks(prev =>
			prev.includes(taskId)
				? prev.filter(id => id !== taskId)
				: [...prev, taskId]
		);
	};

	// Логика скачивания выбранных задач
	const handleBulkDownload = () => {
		console.log('Bulk download for tasks:', selectedTasks);
		// Реальная логика скачивания
	};

	return {
		isLoading,
		error,
		sections,
		featuredQuiz,
		filteredTasks,
		collections,
		selectedTasks,
		taskFilter,
		setTaskFilter,
		toggleTaskSelection,
		handleBulkDownload,
	};
};
