import React, { useEffect, useMemo, useState } from 'react';
import {
	Accordion,
	Alert,
	Badge,
	Button,
	Card,
	Checkbox,
	Container,
	Divider,
	Group,
	Progress,
	SegmentedControl,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Loader,
} from '@mantine/core';
import {
	IconBook2,
	IconCoin,
	IconDownload,
	IconFileDescription,
	IconFolder,
	IconPlayerPlay,
	IconProgress,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { showNotification } from '@mantine/notifications';
import { apiService } from '../api';
import type { SectionWithTopics, TopicWithMaterials } from '../models/material';
import type {
	DownloadableTask,
	TaskCollection,
	TaskSource,
} from '../models/task';
import type { Quiz } from '../models/quiz';
import { useTelegram } from '../hooks/useTelegram';
import { useUserData } from '../hooks/useUserData';
import { isAxiosError } from 'axios';


type SectionWithFullTopics = Omit<SectionWithTopics, 'topics'> & {
	topics: TopicWithMaterials[];
};

const fileTypeLabels: Record<string, string> = {
	pdf: 'PDF',
	word: 'WORD',
	zip: 'ZIP',
	other: 'Файл',
};

const sourceLabels: Record<TaskSource, string> = {
	ege: 'ЕГЭ',
	fipi: 'ФИПИ',
	other: 'Другое',
};

const Home: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useTelegram();
	const { refreshData } = useUserData();
	const [sections, setSections] = useState<SectionWithFullTopics[]>([]);
	const [featuredQuiz, setFeaturedQuiz] = useState<Quiz | null>(null);
	const [tasksList, setTasksList] = useState<DownloadableTask[]>([]);
	const [collections, setCollections] = useState<TaskCollection[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [hasInitializedPurchases, setHasInitializedPurchases] = useState(false);
	const [purchasedTopics, setPurchasedTopics] = useState<Set<number>>(
		new Set()
	);
	const [taskFilter, setTaskFilter] = useState<'all' | TaskSource>('all');
	const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
	const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null);

	useEffect(() => {
		const loadData = async (): Promise<void> => {
			try {
				setIsLoading(true);
				setError(null);
				const [catalog, quizzes, tasks] = await Promise.all([
					apiService.getMaterialsCatalog(user?.id),
					apiService.getQuizzesList(user?.id),
					apiService.getDownloadableTasks(),
				]);

				const normalizedSections: SectionWithFullTopics[] = (
					catalog.sections || []
				).map(section => ({
					...section,
					topics: (section.topics || []) as TopicWithMaterials[],
				}));

				setSections(normalizedSections);
				setFeaturedQuiz(quizzes[0] ?? null);
				setTasksList(tasks.tasks || []);
				setCollections(tasks.collections || []);
			} catch (err: unknown) {
				console.error('Failed to load home data', err);
				setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
			} finally {
				setIsLoading(false);
			}
		};

		loadData().catch(console.error);
	}, [user?.id]);

	useEffect(() => {
		if (hasInitializedPurchases || sections.length === 0) {
			return;
		}

		const defaults = new Set<number>();
		sections.forEach(section => {
			section.topics.forEach(topic => {
				const topicId =
					typeof topic.get === 'function' ? topic.get('id') : topic.id;
				const numericTopicId = Number(topicId);
				const isPurchased =
					typeof topic.get === 'function'
						? topic.get('is_purchased')
						: topic.is_purchased;

				if (!isNaN(numericTopicId) && isPurchased) {
					defaults.add(numericTopicId);
				}
			});
		});

		setPurchasedTopics(defaults);
		setHasInitializedPurchases(true);
	}, [sections, hasInitializedPurchases]);

	const filteredTasks = useMemo(() => {
		if (taskFilter === 'all') return tasksList;
		return tasksList.filter(task => task.source === taskFilter);
	}, [taskFilter, tasksList]);

	const handlePurchase = async (topic: TopicWithMaterials): Promise<void> => {
		// Безопасное получение ID
		const topicId =
			typeof topic.get === 'function' ? topic.get('id') : topic.id;
		const numericTopicId = Number(topicId);

		if (isNaN(numericTopicId)) {
			console.error('Invalid topic ID:', topicId);
			showNotification({
				title: 'Ошибка',
				message: 'Неверный идентификатор темы',
				color: 'red',
			});
			return;
		}

		const isUnlocked = purchasedTopics.has(numericTopicId);

		const openFirstFile = (): void => {
			const firstFile = topic.files?.[0];
			if (firstFile?.file_url) {
				window.open(firstFile.file_url, '_blank', 'noopener,noreferrer');
			}
		};

		if (isUnlocked) {
			openFirstFile();
			return;
		}

		if (!user) {
			showNotification({
				title: 'Требуется авторизация',
				message:
					'Откройте мини-приложение из Telegram, чтобы покупать материалы.',
				color: 'yellow',
			});
			return;
		}

		if (purchaseLoading === numericTopicId) {
			return;
		}

		setPurchaseLoading(numericTopicId);
		try {
			await apiService.purchaseTopic(user.id, numericTopicId);
			setPurchasedTopics(prev => {
				const next = new Set(prev);
				next.add(numericTopicId);
				return next;
			});
			await refreshData();

			showNotification({
				title: 'Материал открыт',
				message: `Тема «${topic.title}» теперь доступна для просмотра.`,
				icon: <IconCoin size={18} />,
				color: 'teal',
			});

			openFirstFile();
		} catch (err: unknown) {
			const message = isAxiosError(err)
				? err.response?.data?.message || err.message
				: 'Не удалось оформить покупку';
			showNotification({
				title: 'Ошибка покупки',
				message,
				color: 'red',
			});
		} finally {
			setPurchaseLoading(null);
		}
	};

	const toggleTaskSelection = (taskId: number): void => {
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

	const handleBulkDownload = (): void => {
		if (selectedTasks.size === 0) {
			showNotification({
				title: 'Выберите задания',
				message: 'Отметьте хотя бы одно задание, чтобы собрать архив.',
				color: 'yellow',
			});
			return;
		}

		const selected = tasksList.filter(task => selectedTasks.has(task.id));
		const totalSize = selected.reduce(
			(acc, task) => acc + (task.file_size || 0),
			0
		);

		showNotification({
			title: 'Архив формируется',
			message: `Собрано ${selected.length} файлов (≈ ${totalSize.toFixed(
				1
			)} МБ). Ссылка появится в мини-приложении.`,
			icon: <IconDownload size={18} />,
			color: 'teal',
		});
	};

	const topicCard = (topic: TopicWithMaterials): React.ReactNode => {
		// Безопасное получение данных с явными типами
		const topicId =
			typeof topic.get === 'function' ? topic.get('id') : topic.id;
		const numericTopicId = Number(topicId);

		const topicTitle: string = String(
			(typeof topic.get === 'function' ? topic.get('title') : topic.title) || ''
		);

		const topicDescription: string = String(
			(typeof topic.get === 'function'
				? topic.get('description')
				: topic.description) || ''
		);

		const topicPrice =
			typeof topic.get === 'function'
				? topic.get('price_repcoins')
				: topic.price_repcoins;
		const numericTopicPrice = Number(topicPrice) || 0;

		const topicFiles = topic.files || [];

		const isUnlocked = purchasedTopics.has(numericTopicId);

		return (
			<Card
				key={numericTopicId}
				withBorder
				radius='md'
				padding='lg'
				shadow='sm'
			>
				<Stack gap='xs'>
					<Group justify='space-between' align='flex-start'>
						<div>
							<Text fw={600}>{topicTitle}</Text>
							<Text c='dimmed' size='sm'>
								{topicDescription}
							</Text>
						</div>
						<Badge
							color={isUnlocked ? 'teal' : 'gray'}
							leftSection={<IconCoin size={14} />}
						>
							{numericTopicPrice} реп.
						</Badge>
					</Group>

					<Button
						variant={isUnlocked ? 'light' : 'filled'}
						color={isUnlocked ? 'teal' : 'blue'}
						onClick={() => {
							void handlePurchase(topic);
						}}
						loading={purchaseLoading === numericTopicId}
					>
						{isUnlocked ? 'Открыть' : `Купить и открыть`}
					</Button>

					{isUnlocked && topicFiles.length ? (
						<Stack gap='xs'>
							{topicFiles.map(file => (
								<Group
									key={file.id}
									justify='space-between'
									align='flex-start'
									wrap='nowrap'
								>
									<div>
										<Text size='sm' fw={500}>
											{file.name}
										</Text>
										<Group gap='xs'>
											<Badge variant='light' color='gray'>
												{fileTypeLabels[file.file_type] || 'FILE'}
											</Badge>
											{file.file_size && (
												<Text size='xs' c='dimmed'>
													{file.file_size} МБ
												</Text>
											)}
										</Group>
									</div>
									<Button
										size='xs'
										variant='subtle'
										leftSection={<IconDownload size={14} />}
										component='a'
										href={file.file_url}
										target='_blank'
										rel='noreferrer'
									>
										Скачать
									</Button>
								</Group>
							))}
						</Stack>
					) : null}
				</Stack>
			</Card>
		);
	};

	if (error) {
		return (
			<Container size='lg' py='xl'>
				<Alert color='red' title='Ошибка' variant='filled'>
					{error}
				</Alert>
			</Container>
		);
	}

	if (isLoading) {
		return (
			<Container size='lg' py='xl'>
				<Stack align='center' gap='sm'>
					<Loader color='teal' />
					<Text c='dimmed'>Загружаем материалы и задания...</Text>
				</Stack>
			</Container>
		);
	}

	return (
		<Container size='lg' py='xl'>
			<Stack gap='xl'>
				<section>
					<Group justify='space-between' mb='md'>
						<div>
							<Title order={1}>Каталог материалов</Title>
							<Text c='dimmed'>
								Разделы → темы → файлы. Покупайте за репкоины и открывайте
								конспекты.
							</Text>
						</div>
						<ThemeIcon size='xl' radius='md' color='teal'>
							<IconFolder size={24} />
						</ThemeIcon>
					</Group>

					<Accordion
						multiple
						defaultValue={sections[0]?.slug ? [sections[0].slug] : []}
					>
						{sections.map(section => (
							<Accordion.Item key={section.id} value={section.slug}>
								<Accordion.Control>
									<Group gap='sm'>
										<ThemeIcon variant='light' color='teal'>
											{section.icon || '📘'}
										</ThemeIcon>
										<div>
											<Text fw={600}>{section.title}</Text>
											<Text size='sm' c='dimmed'>
												{section.description}
											</Text>
										</div>
									</Group>
								</Accordion.Control>
								<Accordion.Panel>
									<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='lg'>
										{section.topics.map(topic => topicCard(topic))}
									</SimpleGrid>
								</Accordion.Panel>
							</Accordion.Item>
						))}
					</Accordion>
				</section>

				{featuredQuiz ? (
					<section>
						<Card withBorder radius='lg' padding='lg' shadow='sm'>
							<Group justify='space-between' align='flex-start' mb='md'>
								<div>
									<Group gap='xs'>
										<ThemeIcon variant='light' color='violet'>
											<IconBook2 size={18} />
										</ThemeIcon>
										<Text fw={600}>{featuredQuiz.title}</Text>
									</Group>
									<Text c='dimmed' size='sm'>
										{featuredQuiz.description}
									</Text>
									<Group gap='xs' mt='xs'>
										<Badge variant='light'>
											{featuredQuiz.total_questions} вопросов
										</Badge>
										{featuredQuiz.estimated_minutes && (
											<Badge variant='light'>
												{featuredQuiz.estimated_minutes} мин. на прохождение
											</Badge>
										)}
										<Badge variant='light' leftSection={<IconCoin size={14} />}>
											+1 репкоин за правильный ответ
										</Badge>
									</Group>
								</div>
								<Button
									size='md'
									leftSection={<IconPlayerPlay size={16} />}
									onClick={() => navigate('/quiz')}
								>
									Начать тест
								</Button>
							</Group>
							<Progress
								value={
									featuredQuiz.total_questions > 0
										? (1 / featuredQuiz.total_questions) * 100
										: 0
								}
								color='violet'
								radius='xl'
								size='lg'
							/>
							<Text size='sm' c='dimmed' mt='xs'>
								3 типа вопросов: одиночный выбор, множественный и True/False.
								Таймер в каждом вопросе ограничивает время ответа.
							</Text>
						</Card>
					</section>
				) : (
					<section>
						<Alert
							color='yellow'
							variant='light'
							title='Викторины скоро появятся'
						>
							Мы готовим новые тесты. Загляните позже!
						</Alert>
					</section>
				)}

				<section>
					<Group justify='space-between' mb='sm'>
						<div>
							<Title order={2}>Задания для скачивания</Title>
							<Text c='dimmed'>
								Соберите задания ЕГЭ/ФИПИ в один архив и скачайте в
								мини-приложении.
							</Text>
						</div>
						<ThemeIcon size='xl' radius='md' color='blue'>
							<IconDownload size={24} />
						</ThemeIcon>
					</Group>

					<SegmentedControl
						value={taskFilter}
						onChange={value => setTaskFilter(value as 'all' | TaskSource)}
						data={[
							{ label: 'Все', value: 'all' },
							{ label: 'ЕГЭ', value: 'ege' },
							{ label: 'ФИПИ', value: 'fipi' },
							{ label: 'Другие', value: 'other' },
						]}
					/>

					<Stack gap='md' mt='md'>
						{filteredTasks.map(task => (
							<Card
								key={task.id}
								withBorder
								radius='md'
								padding='md'
								shadow='xs'
							>
								<Group justify='space-between' align='flex-start'>
									<div>
										<Group gap='xs'>
											<Badge color='blue' variant='light'>
												{sourceLabels[task.source]}
											</Badge>
											<Text fw={600}>{task.title}</Text>
										</Group>
										<Text size='sm' c='dimmed'>
											{task.description}
										</Text>
										<Group gap='xs' mt='xs'>
											<Badge variant='light'>
												{fileTypeLabels[task.file_type] || 'FILE'}
											</Badge>
											{task.file_size && (
												<Badge variant='light' color='gray'>
													{task.file_size} МБ
												</Badge>
											)}
											{task.year && (
												<Text size='xs' c='dimmed'>
													{task.year} год
												</Text>
											)}
										</Group>
									</div>
									<Stack gap='xs' align='flex-end'>
										<Checkbox
											label='В пакет'
											checked={selectedTasks.has(task.id)}
											onChange={() => toggleTaskSelection(task.id)}
										/>
										<Button
											size='xs'
											variant='light'
											leftSection={<IconDownload size={14} />}
											component='a'
											href={task.file_url}
											target='_blank'
											rel='noreferrer'
										>
											Скачать
										</Button>
									</Stack>
								</Group>
							</Card>
						))}
					</Stack>

					<Group justify='space-between' mt='md'>
						<Button
							variant='filled'
							color='teal'
							leftSection={<IconDownload size={16} />}
							onClick={handleBulkDownload}
							disabled={selectedTasks.size === 0}
						>
							Скачать одним файлом ({selectedTasks.size})
						</Button>
						<Text size='sm' c='dimmed'>
							Отметьте задания чекбоксами, чтобы добавить в общий архив.
						</Text>
					</Group>

					<Divider my='lg' label='Готовые подборки' labelPosition='center' />

					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='lg'>
						{collections.map(collection => (
							<Card
								key={collection.id}
								withBorder
								radius='md'
								padding='lg'
								shadow='sm'
							>
								<Stack gap='xs'>
									<Group gap='xs'>
										<ThemeIcon variant='light' color='grape'>
											<IconFileDescription size={18} />
										</ThemeIcon>
										<Text fw={600}>{collection.title}</Text>
									</Group>
									<Text size='sm' c='dimmed'>
										{collection.description}
									</Text>
									<Group gap='xs'>
										<Badge variant='light'>
											{sourceLabels[collection.source]}
										</Badge>
										<Badge variant='light' color='gray'>
											{collection.total_tasks} файлов
										</Badge>
										{collection.total_size && (
											<Badge variant='light' color='gray'>
												{collection.total_size} МБ
											</Badge>
										)}
									</Group>
									<Button
										variant='subtle'
										leftSection={<IconProgress size={16} />}
										onClick={() =>
											showNotification({
												title: 'Сборка коллекции',
												message: `Коллекция «${collection.title}» готова к выгрузке в мини-приложении.`,
												color: 'grape',
											})
										}
									>
										Собрать коллекцию
									</Button>
								</Stack>
							</Card>
						))}
					</SimpleGrid>
				</section>
			</Stack>
		</Container>
	);
};

export default Home;
