import { useState, useEffect, useCallback } from 'react';
import {
	Button,
	Group,
	Text,
	Card,
	Badge,
	Modal,
	Stack,
	Paper,
	Center,
	Loader,
	Progress,
	Alert,
} from '@mantine/core';
import {
	ArrowLeft,
	Droplets,
	Brain,
	Trophy,
	TrendingUp,
	AlertCircle,
	Sprout,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../api';
import type { BioGardenPlant, BioGardenQuestion, AnswerResponse } from '../../models/biogarden';
import { useTelegram } from '../../hooks';
import { BioGardenScene } from './BioGardenScene';

// Заглушка из seed-данных — показывается когда бэкенд недоступен
const MOCK_PLANTS: BioGardenPlant[] = [
	{ id: 1, name: 'Горох посевной', scientific_name: 'Pisum sativum', description: 'Классический объект генетики Менделя', image_url: '', growth_stages: 5, required_experience: 0, difficulty_level: 1, biology_topics: ['Генетика', 'Ботаника'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 2, name: 'Кукуруза', scientific_name: 'Zea mays', description: 'Важная сельскохозяйственная культура', image_url: '', growth_stages: 6, required_experience: 0, difficulty_level: 2, biology_topics: ['Генетика', 'Агрономия'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 3, name: 'Хламидомонада', scientific_name: 'Chlamydomonas', description: 'Одноклеточная зелёная водоросль', image_url: '', growth_stages: 4, required_experience: 0, difficulty_level: 3, biology_topics: ['Цитология', 'Фотосинтез'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 4, name: 'Папоротник', scientific_name: 'Polypodiopsida', description: 'Древнее растение, размножается спорами', image_url: '', growth_stages: 7, required_experience: 0, difficulty_level: 4, biology_topics: ['Ботаника', 'Размножение'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 5, name: 'Эвглена зелёная', scientific_name: 'Euglena viridis', description: 'Пограничный организм между растениями и животными', image_url: '', growth_stages: 5, required_experience: 0, difficulty_level: 5, biology_topics: ['Цитология', 'Систематика'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 6, name: 'Картофель', scientific_name: 'Solanum tuberosum', description: 'Вегетативное размножение клубнями', image_url: '', growth_stages: 6, required_experience: 0, difficulty_level: 6, biology_topics: ['Ботаника', 'Размножение'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
];

const getDifficultyColor = (level: number) => {
	if (level <= 2) return 'green';
	if (level <= 4) return 'yellow';
	if (level <= 5) return 'orange';
	return 'red';
};

export const BioGardenGame = () => {
	const navigate = useNavigate();
	const [plants, setPlants] = useState<BioGardenPlant[]>(MOCK_PLANTS);
	const [apiOffline, setApiOffline] = useState(false);
	const [selectedPlant, setSelectedPlant] = useState<BioGardenPlant | null>(null);
	const [currentQuestion, setCurrentQuestion] = useState<BioGardenQuestion | null>(null);
	const [loading, setLoading] = useState(true);
	const [answering, setAnswering] = useState(false);
	const [questionModalOpen, setQuestionModalOpen] = useState(false);
	const [resultModalOpen, setResultModalOpen] = useState(false);
	const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
	const [userCoins, setUserCoins] = useState(0);
	const [totalExperience, setTotalExperience] = useState(0);
	const { user, isLoading: telegramLoading } = useTelegram();

	const telegramId = Number(user?.id);

	const fetchPlants = useCallback(async (): Promise<BioGardenPlant[]> => {
		// Не делаем запрос пока ID не определён
		if (!telegramId || isNaN(telegramId)) {
			setApiOffline(true);
			return MOCK_PLANTS;
		}
		try {
			const data = await apiService.getPlantsList(telegramId);
			setPlants(data.plants);
			setUserCoins(data.user_coins);
			setTotalExperience(data.total_experience);
			setApiOffline(false);
			return data.plants;
		} catch (error) {
			console.error('Error fetching plants:', error);
			setPlants(MOCK_PLANTS);
			setApiOffline(true);
			return MOCK_PLANTS;
		}
	}, [telegramId]);

	useEffect(() => {
		// Ждём пока Telegram контекст готов, потом загружаем
		if (telegramLoading) return;
		fetchPlants().finally(() => setLoading(false));
	}, [fetchPlants, telegramLoading]);

	// Синхронизирует данные выбранного растения после обновления списка
	const syncSelectedPlant = (updatedPlants: BioGardenPlant[]) => {
		setSelectedPlant(prev => {
			if (!prev) return null;
			return updatedPlants.find(p => p.id === prev.id) ?? prev;
		});
	};

	const handleStartPlant = async (plantId: number) => {
		try {
			await apiService.startPlant(telegramId, plantId);
			const updated = await fetchPlants();
			const plant = updated.find(p => p.id === plantId);
			if (plant) {
				setSelectedPlant(plant);
				await fetchQuestion(plantId);
			}
		} catch (error) {
			console.error('Error starting plant:', error);
		}
	};

	const fetchQuestion = async (plantId: number) => {
		try {
			const data = await apiService.getCurrentQuestion(telegramId, plantId);
			setCurrentQuestion(data.question);
			setQuestionModalOpen(true);
		} catch (error) {
			console.error('Error fetching question:', error);
		}
	};

	const handleAnswer = async (optionId: number) => {
		if (!currentQuestion || !selectedPlant) return;
		setAnswering(true);
		try {
			const data = await apiService.submitAnswer(
				telegramId,
				selectedPlant.id,
				currentQuestion.id,
				optionId,
			);
			setAnswerResult(data);
			setResultModalOpen(true);
			const updated = await fetchPlants();
			syncSelectedPlant(updated);
		} catch (error) {
			console.error('Error submitting answer:', error);
		} finally {
			setAnswering(false);
		}
	};

	const handleWaterPlant = async (plantId: number) => {
		try {
			await apiService.waterPlant(telegramId, plantId);
			const updated = await fetchPlants();
			syncSelectedPlant(updated);
		} catch (error) {
			console.error('Error watering plant:', error);
		}
	};

	const handlePlantSelect = (plant: BioGardenPlant) => {
		setSelectedPlant(plant);
	};

	const handleDeselect = () => {
		setSelectedPlant(null);
	};

	if (loading) {
		return (
			<Center h='100dvh' style={{ background: '#080d1a' }}>
				<Stack align='center' gap='md'>
					<Loader size='lg' color='teal' />
					<Text c='dimmed'>Загружаем сад…</Text>
				</Stack>
			</Center>
		);
	}

	return (
		<div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
			{/* 3D Сцена занимает весь экран */}
			<div style={{ width: '100%', height: '100%' }}>
				<BioGardenScene
					plants={plants}
					selectedPlantId={selectedPlant?.id ?? null}
					onPlantSelect={handlePlantSelect}
					onDeselect={handleDeselect}
				/>
			</div>

			{/* Верхний HUD */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					padding: '10px 14px',
					background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
					zIndex: 10,
					pointerEvents: 'none',
				}}
			>
				<Group justify='space-between' align='center'>
					<Button
						leftSection={<ArrowLeft size={15} />}
						onClick={() => navigate(-1)}
						variant='filled'
						color='dark'
						size='xs'
						style={{ opacity: 0.9, pointerEvents: 'all' }}
					>
						Назад
					</Button>

					<Stack gap={2} align='center'>
						<Text c='white' fw={700} size='md' style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
							🌱 Биосадовник
						</Text>
						{apiOffline && (
							<Badge size='xs' color='red' variant='filled' style={{ pointerEvents: 'all' }}>
								⚠ сервер недоступен
							</Badge>
						)}
					</Stack>

					<Group gap={6}>
						<Paper
							p='5px 10px'
							style={{
								background: 'rgba(0,0,0,0.6)',
								backdropFilter: 'blur(8px)',
								border: '1px solid rgba(255,255,255,0.1)',
								pointerEvents: 'all',
							}}
						>
							<Group gap={5}>
								<Trophy size={13} color='#fbbf24' />
								<Text c='white' size='xs' fw={600}>
									{userCoins}
								</Text>
							</Group>
						</Paper>
						<Paper
							p='5px 10px'
							style={{
								background: 'rgba(0,0,0,0.6)',
								backdropFilter: 'blur(8px)',
								border: '1px solid rgba(255,255,255,0.1)',
								pointerEvents: 'all',
							}}
						>
							<Group gap={5}>
								<TrendingUp size={13} color='#60a5fa' />
								<Text c='white' size='xs' fw={600}>
									{totalExperience} XP
								</Text>
							</Group>
						</Paper>
						<Paper
							p='5px 10px'
							style={{
								background: 'rgba(0,0,0,0.6)',
								backdropFilter: 'blur(8px)',
								border: '1px solid rgba(255,255,255,0.1)',
								pointerEvents: 'all',
							}}
						>
							<Group gap={5}>
								<Sprout size={13} color='#4ade80' />
								<Text c='white' size='xs' fw={600}>
									{plants.filter(p => p.is_unlocked).length}/{plants.length}
								</Text>
							</Group>
						</Paper>
					</Group>
				</Group>
			</div>

			{/* Подсказка при отсутствии выбранного растения */}
			<AnimatePresence>
				{!selectedPlant && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						transition={{ duration: 0.3 }}
						style={{
							position: 'absolute',
							bottom: 24,
							left: '50%',
							transform: 'translateX(-50%)',
							zIndex: 10,
							pointerEvents: 'none',
						}}
					>
						<Paper
							p='sm'
							style={{
								background: 'rgba(0,0,0,0.7)',
								backdropFilter: 'blur(8px)',
								border: '1px solid rgba(255,255,255,0.12)',
							}}
						>
							<Text c='white' size='sm' ta='center'>
								Нажмите на растение для взаимодействия
							</Text>
						</Paper>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Нижняя панель выбранного растения */}
			<AnimatePresence>
				{selectedPlant && (
					<motion.div
						initial={{ y: '100%' }}
						animate={{ y: 0 }}
						exit={{ y: '100%' }}
						transition={{ type: 'spring', damping: 28, stiffness: 220 }}
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							zIndex: 10,
							pointerEvents: 'all',
						}}
					>
						<div
							style={{
								background: 'linear-gradient(to top, rgba(5,10,20,0.97) 80%, transparent 100%)',
								backdropFilter: 'blur(12px)',
								padding: '16px 16px 20px',
							}}
						>
							<Stack gap={10}>
								{/* Заголовок */}
								<Group justify='space-between' align='flex-start'>
									<div>
										<Text c='white' fw={700} size='md'>
											{selectedPlant.name}
										</Text>
										<Text c='dimmed' size='xs' fs='italic'>
											{selectedPlant.scientific_name}
										</Text>
									</div>
									<Badge
										color={getDifficultyColor(selectedPlant.difficulty_level)}
										variant='filled'
										size='sm'
									>
										Уровень {selectedPlant.difficulty_level}
									</Badge>
								</Group>

								{/* Прогресс роста */}
								<div>
									<Group justify='space-between' mb={4}>
										<Text c='dimmed' size='xs'>
											Стадия {selectedPlant.current_stage}/{selectedPlant.growth_stages}
										</Text>
										<Text c='dimmed' size='xs'>
											{selectedPlant.experience_points} XP
										</Text>
									</Group>
									<Progress
										value={(selectedPlant.current_stage / selectedPlant.growth_stages) * 100}
										size='sm'
										color='teal'
										radius='xl'
									/>
								</div>

								{/* HP */}
								<div>
									<Group justify='space-between' mb={4}>
										<Text c='dimmed' size='xs'>
											Здоровье
										</Text>
										<Text
											size='xs'
											c={
												selectedPlant.health_points < 30
													? 'red'
													: selectedPlant.health_points < 60
														? 'yellow'
														: 'green'
											}
										>
											{selectedPlant.health_points}/{selectedPlant.max_health_points}
										</Text>
									</Group>
									<Progress
										value={
											(selectedPlant.health_points / selectedPlant.max_health_points) * 100
										}
										size='sm'
										color={
											selectedPlant.health_points < 30
												? 'red'
												: selectedPlant.health_points < 60
													? 'yellow'
													: 'green'
										}
										radius='xl'
									/>
								</div>

								{/* Предупреждение о низком HP */}
								{selectedPlant.health_points < 30 && selectedPlant.health_points > 0 && (
									<Alert
										icon={<AlertCircle size={14} />}
										color='red'
										variant='light'
										p='xs'
									>
										<Text size='xs'>Растение нуждается в поливе!</Text>
									</Alert>
								)}

								{/* Кнопки действий */}
								{apiOffline ? (
									<Alert icon={<AlertCircle size={14} />} color='red' variant='light' p='xs'>
										<Text size='xs'>Запустите сервер для взаимодействия с растениями</Text>
									</Alert>
								) : (
									<Group grow gap={8}>
										{selectedPlant.is_unlocked ? (
											<>
												<Button
													leftSection={<Brain size={14} />}
													onClick={() => fetchQuestion(selectedPlant.id)}
													disabled={selectedPlant.is_completed}
													size='sm'
													color='teal'
												>
													{selectedPlant.is_completed ? '✓ Завершено' : 'Ухаживать'}
												</Button>
												{selectedPlant.health_points < selectedPlant.max_health_points && (
													<Button
														leftSection={<Droplets size={14} />}
														variant='light'
														color='blue'
														onClick={() => handleWaterPlant(selectedPlant.id)}
														size='sm'
													>
														Полить (−10 🪙)
													</Button>
												)}
											</>
										) : (
											<Button
												leftSection={<Sprout size={14} />}
												onClick={() => handleStartPlant(selectedPlant.id)}
												size='sm'
												color='green'
												variant='filled'
											>
												Начать выращивать
											</Button>
										)}
									</Group>
								)}

								{/* Темы */}
								{selectedPlant.biology_topics?.length > 0 && (
									<Group gap={4} wrap='wrap'>
										{selectedPlant.biology_topics.map((topic, i) => (
											<Badge key={i} size='xs' variant='dot' color='teal'>
												{topic}
											</Badge>
										))}
									</Group>
								)}
							</Stack>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Модальное окно — вопрос */}
			<Modal
				opened={questionModalOpen}
				onClose={() => setQuestionModalOpen(false)}
				title={
					<Group gap='xs'>
						<Brain size={18} />
						<Text fw={600}>Вопрос по биологии</Text>
					</Group>
				}
				size='lg'
				centered
			>
				{currentQuestion && (
					<Stack>
						<Badge color='blue' variant='light'>
							{currentQuestion.biology_topic} • {currentQuestion.ege_code}
						</Badge>

						<Text fw={500} size='md'>
							{currentQuestion.question_text}
						</Text>

						<Stack gap='sm'>
							{currentQuestion.options.map(option => (
								<Button
									key={option.id}
									variant='outline'
									fullWidth
									justify='start'
									onClick={() => handleAnswer(option.id)}
									disabled={answering}
								>
									{option.option_text}
								</Button>
							))}
						</Stack>

						<Group justify='space-between' mt='xs'>
							<Text size='sm' c='dimmed'>
								Этап: {currentQuestion.current_stage}/{currentQuestion.total_stages}
							</Text>
							<Badge color='green'>{currentQuestion.points} XP за ответ</Badge>
						</Group>
					</Stack>
				)}
			</Modal>

			{/* Модальное окно — результат ответа */}
			<Modal
				opened={resultModalOpen}
				onClose={() => setResultModalOpen(false)}
				title={
					<Group gap='xs'>
						{answerResult?.is_correct ? (
							<Trophy size={18} color='#fbbf24' />
						) : (
							<AlertCircle size={18} color='#f87171' />
						)}
						<Text fw={600} c={answerResult?.is_correct ? 'green' : 'red'}>
							{answerResult?.is_correct ? 'Правильно!' : 'Неправильно'}
						</Text>
					</Group>
				}
				size='md'
				centered
			>
				{answerResult && (
					<Stack>
						<Text size='sm'>{answerResult.explanation}</Text>

						<Group grow>
							<Card withBorder p='md' ta='center'>
								<Brain size={22} color='#60a5fa' style={{ margin: '0 auto 6px' }} />
								<Text size='xs' c='dimmed'>
									Опыт
								</Text>
								<Text fw={700} size='lg' c={answerResult.earned_experience > 0 ? 'blue' : 'dimmed'}>
									+{answerResult.earned_experience}
								</Text>
							</Card>
							<Card withBorder p='md' ta='center'>
								<Trophy size={22} color='#fbbf24' style={{ margin: '0 auto 6px' }} />
								<Text size='xs' c='dimmed'>
									Монеты
								</Text>
								<Text fw={700} size='lg' c={answerResult.earned_coins > 0 ? 'yellow' : 'dimmed'}>
									+{answerResult.earned_coins}
								</Text>
							</Card>
						</Group>

						<Button
							fullWidth
							onClick={() => {
								setResultModalOpen(false);
								setQuestionModalOpen(false);
							}}
							color='teal'
						>
							Продолжить
						</Button>
					</Stack>
				)}
			</Modal>
		</div>
	);
};
