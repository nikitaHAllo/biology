import { useState, useEffect, useMemo } from 'react';
import { useTelegram } from '../useTelegram';
import { apiService } from '../../api';
import type { SectionWithTopics, Quiz, DownloadableTask, TaskCollection } from '../../models';

interface UseHomeDataReturn {
	isLoading: boolean;
	error: string | null;
	sections: SectionWithTopics[];
	featuredQuiz: Quiz | null;
	filteredTasks: DownloadableTask[];
	collections: TaskCollection[];
	selectedTasks: Set<number>;
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
	const [collections, setCollections] = useState<TaskCollection[]>([]);
	const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
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
				setCollections(tasksData.collections);
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

	const featuredQuiz = useMemo(() => {
		return (
			quizzes.find((q: Quiz & { featured?: boolean }) => q.featured) ||
			quizzes[0] ||
			null
		);
	}, [quizzes]);

	const filteredTasks = useMemo(() => {
		if (taskFilter === 'all') return tasks;
		return tasks.filter(task => task.source === taskFilter);
	}, [tasks, taskFilter]);

	const toggleTaskSelection = (taskId: number) => {
		setSelectedTasks(prev => {
			const next = new Set(prev);
			if (next.has(taskId)) {
				next.delete(taskId);
			} else {
				next.add(taskId);
			}
			return next;
		});
	};

	const handleBulkDownload = () => {
		console.log('Bulk download for tasks:', Array.from(selectedTasks));
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
