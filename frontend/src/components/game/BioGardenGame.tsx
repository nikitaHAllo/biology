// frontend/src/pages/BioGardenGame.tsx
import React, { useState, useEffect } from 'react';
import {
	Container,
	Title,
	Text,
	Card,
	Grid,
	Button,
	Group,
	Progress,
	Stack,
	Paper,
	ThemeIcon,
	Badge,
	Modal,
	Center,
	Loader,
	Alert,
} from '@mantine/core';
import {
	Sprout,
	ArrowLeft,
	Droplets,
	Brain,
	Trophy,
	TrendingUp,
	Leaf,
	AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../api';
import type {
	BioGardenPlant,
	BioGardenQuestion,
	AnswerResponse,
} from '../../models/biogarden';
import { useTelegram } from '../../hooks';

export const BioGardenGame = () => {
	const navigate = useNavigate();
	const [plants, setPlants] = useState<BioGardenPlant[]>([]);
	const [selectedPlant, setSelectedPlant] = useState<BioGardenPlant | null>(
		null,
	);
	const [currentQuestion, setCurrentQuestion] =
		useState<BioGardenQuestion | null>(null);
	const [loading, setLoading] = useState(true);
	const [answering, setAnswering] = useState(false);
	const [modalOpened, setModalOpened] = useState(false);
	const [resultModalOpened, setResultModalOpened] = useState(false);
	const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
	const [userCoins, setUserCoins] = useState(0);
	const [totalExperience, setTotalExperience] = useState(0);
	const { user } = useTelegram();

	const telegramId = Number(user?.id);

	useEffect(() => {
		fetchPlants();
	}, []);

	const fetchPlants = async () => {
		try {
			const data = await apiService.getPlantsList(telegramId);
			setPlants(data.plants);
			setUserCoins(data.user_coins);
			setTotalExperience(data.total_experience);
		} catch (error) {
			console.error('Error fetching plants:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleStartPlant = async (plantId: number) => {
		try {
			await apiService.startPlant(telegramId, plantId);
			await fetchPlants(); // Обновляем список
			const plant = plants.find(p => p.id === plantId);
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
			setModalOpened(true);
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
			setResultModalOpened(true);
			await fetchPlants(); // Обновляем прогресс
		} catch (error) {
			console.error('Error submitting answer:', error);
		} finally {
			setAnswering(false);
		}
	};

	const handleWaterPlant = async (plantId: number) => {
		try {
			await apiService.waterPlant(telegramId, plantId);
			await fetchPlants(); // Обновляем список
			alert('Растение полито!');
		} catch (error) {
			console.error('Error fetching question:', error);
		}
	};

	const PlantCard = ({ plant }: { plant: BioGardenPlant }) => (
		<Card shadow='sm' padding='lg' radius='md' withBorder>
			<Group justify='space-between' mb='xs'>
				<Group>
					<ThemeIcon
						color={plant.is_completed ? 'yellow' : 'green'}
						variant='light'
					>
						<Sprout size={24} />
					</ThemeIcon>
					<div>
						<Text fw={500}>{plant.name}</Text>
						<Text size='sm' c='dimmed'>
							{plant.scientific_name}
						</Text>
					</div>
				</Group>
				<Badge color={getDifficultyColor(plant.difficulty_level)}>
					Уровень {plant.difficulty_level}
				</Badge>
			</Group>

			<Text size='sm' c='dimmed' mb='md'>
				{plant.description}
			</Text>

			<Progress
				value={(plant.current_stage / plant.growth_stages) * 100}
				// label={`${plant.current_stage}/${plant.growth_stages}`}
				size='md'
				radius='xl'
				mb='md'
			/>

			<Group justify='space-between' mb='xs'>
				<Group gap='xs'>
					<Brain size={16} />
					<Text size='sm'>Опыт: {plant.experience_points}</Text>
				</Group>
				<Group gap='xs'>
					<Leaf size={16} />
					<Text size='sm'>
						Здоровье: {plant.health_points}/{plant.max_health_points}
					</Text>
				</Group>
			</Group>

			{plant.health_points < 30 && plant.health_points > 0 && (
				<Alert
					icon={<AlertCircle size={16} />}
					title='Внимание'
					color='red'
					mb='md'
				>
					Растение нуждается в поливе!
				</Alert>
			)}

			<Group grow>
				{plant.is_unlocked ? (
					<>
						<Button
							leftSection={<Brain size={16} />}
							onClick={() => fetchQuestion(plant.id)}
							disabled={plant.is_completed}
						>
							{plant.is_completed ? 'Завершено' : 'Ухаживать'}
						</Button>
						{plant.health_points < 100 && (
							<Button
								leftSection={<Droplets size={16} />}
								variant='light'
								onClick={() => handleWaterPlant(plant.id)}
							>
								Полить
							</Button>
						)}
					</>
				) : (
					<Button onClick={() => handleStartPlant(plant.id)}>
						Начать выращивать
					</Button>
				)}
			</Group>
		</Card>
	);

	const getDifficultyColor = (level: number) => {
		if (level <= 3) return 'green';
		if (level <= 6) return 'yellow';
		if (level <= 8) return 'orange';
		return 'red';
	};

	if (loading) {
		return (
			<Center h={400}>
				<Loader size='lg' />
			</Center>
		);
	}

	return (
		<Container size='lg' py='md'>
			<Stack gap='md'>
				<Button
					leftSection={<ArrowLeft size={16} />}
					onClick={() => navigate(-1)}
					variant='light'
					style={{ alignSelf: 'flex-start' }}
				>
					Назад к модулям
				</Button>

				<Group justify='space-between'>
					<div>
						<Title order={1}>🎍 Биосадовник</Title>
						<Text c='dimmed'>Выращивайте растения, изучая биологию</Text>
					</div>
					<Group>
						<Paper p='md' withBorder>
							<Group gap='xs'>
								<Trophy size={20} />
								<div>
									<Text size='sm' c='dimmed'>
										Монеты
									</Text>
									<Text fw={500}>{userCoins}</Text>
								</div>
							</Group>
						</Paper>
						<Paper p='md' withBorder>
							<Group gap='xs'>
								<TrendingUp size={20} />
								<div>
									<Text size='sm' c='dimmed'>
										Растений
									</Text>
									<Text fw={500}>
										{plants.filter(p => p.is_unlocked).length}/{plants.length}
									</Text>
								</div>
							</Group>
						</Paper>
						<Paper p='md' withBorder>
							<Group gap='xs'>
								<Brain size={20} />
								<div>
									<Text size='sm' c='dimmed'>
										Опыт
									</Text>
									<Text fw={500}>{totalExperience}</Text>
								</div>
							</Group>
						</Paper>
					</Group>
				</Group>

				<Grid>
					{plants.map(plant => (
						<Grid.Col key={plant.id} span={{ base: 12, md: 6, lg: 4 }}>
							<PlantCard plant={plant} />
						</Grid.Col>
					))}
				</Grid>

				{/* Модалка с вопросом */}
				<Modal
					opened={modalOpened}
					onClose={() => setModalOpened(false)}
					title={
						<Group>
							<Brain size={20} />
							<Text fw={500}>Вопрос по биологии</Text>
						</Group>
					}
					size='lg'
				>
					{currentQuestion && (
						<Stack>
							<Badge color='blue' variant='light'>
								{currentQuestion.biology_topic} • {currentQuestion.ege_code}
							</Badge>

							<Text fw={500} size='lg'>
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

							<Group justify='space-between' mt='md'>
								<Text size='sm' c='dimmed'>
									Этап: {currentQuestion.current_stage}/
									{currentQuestion.total_stages}
								</Text>
								<Badge color='green'>{currentQuestion.points} опыта</Badge>
							</Group>
						</Stack>
					)}
				</Modal>

				{/* Модалка с результатом */}
				<Modal
					opened={resultModalOpened}
					onClose={() => setResultModalOpened(false)}
					title={
						<Group>
							{answerResult?.is_correct ? (
								<Trophy size={20} color='green' />
							) : (
								<AlertCircle size={20} color='red' />
							)}
							<Text fw={500}>
								{answerResult?.is_correct ? 'Правильно!' : 'Неправильно'}
							</Text>
						</Group>
					}
				>
					{answerResult && (
						<Stack>
							<Text>{answerResult.explanation}</Text>

							<Group grow>
								<Paper p='md' withBorder>
									<Center>
										<Stack gap={4} align='center'>
											<Brain size={24} color='blue' />
											<Text size='sm' c='dimmed'>
												Опыт
											</Text>
											<Text
												fw={500}
												size='lg'
												c={
													answerResult.earned_experience > 0 ? 'blue' : 'dimmed'
												}
											>
												+{answerResult.earned_experience}
											</Text>
										</Stack>
									</Center>
								</Paper>

								<Paper p='md' withBorder>
									<Center>
										<Stack gap={4} align='center'>
											<Trophy size={24} color='yellow' />
											<Text size='sm' c='dimmed'>
												Монеты
											</Text>
											<Text
												fw={500}
												size='lg'
												c={answerResult.earned_coins > 0 ? 'yellow' : 'dimmed'}
											>
												+{answerResult.earned_coins}
											</Text>
										</Stack>
									</Center>
								</Paper>
							</Group>

							<Button
								fullWidth
								onClick={() => {
									setResultModalOpened(false);
									setModalOpened(false);
								}}
								mt='md'
							>
								Продолжить
							</Button>
						</Stack>
					)}
				</Modal>
			</Stack>
		</Container>
	);
};
