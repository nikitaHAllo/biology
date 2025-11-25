import React, { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Badge,
	Button,
	Card,
	Checkbox,
	Container,
	Group,
	Loader,
	Progress,
	Radio,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import {
	IconCheck,
	IconClockHour4,
	IconCoin,
	IconRefresh,
	IconX,
} from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import type { Quiz, QuizQuestion } from '../models/quiz';
import { apiService } from '../api';

type AnswerState = 'idle' | 'correct' | 'incorrect' | 'timeout';

const QuizPage: React.FC = () => {
	const [quiz, setQuiz] = useState<Quiz | null>(null);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
	const [answerState, setAnswerState] = useState<AnswerState>('idle');
	const [coins, setCoins] = useState(0);
	const [history, setHistory] = useState<
		Record<number, { selected: number[]; isCorrect: boolean }>
	>({});
	const [isFinished, setIsFinished] = useState(false);
	const [remainingTime, setRemainingTime] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const totalQuestions = quiz?.questions.length ?? 0;
	const currentQuestion = quiz?.questions[currentQuestionIndex];

	useEffect(() => {
		const loadQuiz = async (): Promise<void> => {
			try {
				setIsLoading(true);
				setError(null);
				const quizzes = await apiService.getQuizzesList();
				const firstQuiz = quizzes[0];
				console.log(quizzes)
				if (!firstQuiz) {
					setError('Нет доступных викторин');
					setQuiz(null);
					return;
				}

				const quizDetails = await apiService.getQuizDetails(firstQuiz.id);
				setQuiz(quizDetails);
				setCurrentQuestionIndex(0);
				setSelectedOptions([]);
				setHistory({});
				setCoins(0);
				setIsFinished(false);
				setAnswerState('idle');
				setRemainingTime(quizDetails.questions[0]?.timer_seconds ?? null);
			} catch (err: unknown) {
				console.error('Failed to load quiz', err);
				setError('Не удалось загрузить викторину. Попробуйте позже.');
			} finally {
				setIsLoading(false);
			}
		};

		loadQuiz().catch(console.error);
	}, []);

useEffect(() => {
	if (!currentQuestion) {
		setRemainingTime(null);
		return;
	}
	setSelectedOptions([]);
	setAnswerState('idle');
	setRemainingTime(currentQuestion.timer_seconds ?? null);
}, [currentQuestion]);

	useEffect(() => {
		if (
			remainingTime === null ||
			answerState !== 'idle' ||
			isFinished ||
			!currentQuestion
		) {
			return;
		}

		if (remainingTime === 0) {
			handleTimeout();
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setRemainingTime(prev => (prev === null ? prev : Math.max(prev - 1, 0)));
		}, 1000);

		return () => window.clearTimeout(timeoutId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [remainingTime, answerState, isFinished, currentQuestion]);

	const questionProgress = useMemo(() => {
		const answered = Object.keys(history).length;
		return totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0;
	}, [history, totalQuestions]);

	const toggleOption = (optionId: number): void => {
		if (answerState !== 'idle' || !currentQuestion) return;

		if (
			currentQuestion.question_type === 'single_choice' ||
			currentQuestion.question_type === 'true_false'
		) {
			setSelectedOptions([optionId]);
			return;
		}

		setSelectedOptions(prev => {
			if (prev.includes(optionId)) {
				return prev.filter(id => id !== optionId);
			}
			return [...prev, optionId];
		});
	};

	const evaluateAnswer = (question: QuizQuestion, answers: number[]): boolean => {
		const sortedAnswer = [...answers].sort();
		const sortedCorrect = [...question.correct_answer_ids].sort();
		if (sortedAnswer.length === 0) return false;
		if (sortedAnswer.length !== sortedCorrect.length) return false;
		return sortedAnswer.every((value, index) => value === sortedCorrect[index]);
	};

	const handleCheck = (): void => {
		if (
			selectedOptions.length === 0 ||
			answerState !== 'idle' ||
			!currentQuestion
		) {
			return;
		}

		const isCorrect = evaluateAnswer(currentQuestion, selectedOptions);
		setAnswerState(isCorrect ? 'correct' : 'incorrect');
		setHistory(prev => ({
			...prev,
			[currentQuestion.id]: { selected: selectedOptions, isCorrect },
		}));
		setRemainingTime(null);

		if (isCorrect) {
			setCoins(prev => prev + 1);
			showNotification({
				title: 'Правильный ответ!',
				message: 'Вы получили 1 репкоин.',
				icon: <IconCoin size={18} />,
				color: 'teal',
			});
		}
	};

	const handleTimeout = (): void => {
		if (!currentQuestion || answerState !== 'idle') return;
		setAnswerState('timeout');
		setHistory(prev => ({
			...prev,
			[currentQuestion.id]: { selected: [], isCorrect: false },
		}));
		showNotification({
			title: 'Время вышло',
			message: 'Попробуйте ответить быстрее на следующем вопросе.',
			color: 'red',
		});
	};

	const goToNextQuestion = (): void => {
		if (!quiz) return;
		if (currentQuestionIndex === totalQuestions - 1) {
			setIsFinished(true);
			return;
		}
		setCurrentQuestionIndex(prev => prev + 1);
	};

	const restartQuiz = (): void => {
		if (!quiz) return;
		setCurrentQuestionIndex(0);
		setSelectedOptions([]);
		setAnswerState('idle');
		setCoins(0);
		setHistory({});
		setIsFinished(false);
		setRemainingTime(quiz.questions[0]?.timer_seconds ?? null);
	};

	const renderOptions = (): React.ReactNode => {
		if (!currentQuestion) {
			return null;
		}

		if (
			currentQuestion.question_type === 'single_choice' ||
			currentQuestion.question_type === 'true_false'
		) {
			const singleValue = selectedOptions[0]?.toString() ?? '';
			return (
				<Radio.Group
					value={singleValue}
					name={`question-${currentQuestion.id}`}
					onChange={value => toggleOption(Number(value))}
				>
					<Stack gap='sm'>
						{currentQuestion.options.map(option => (
							<Card
								key={option.id}
								withBorder
								shadow='xs'
								style={{
									borderColor: selectedOptions.includes(option.id)
										? 'var(--mantine-color-teal-6)'
										: undefined,
								}}
							>
								<Radio
									value={option.id.toString()}
									label={option.option_text}
									disabled={answerState !== 'idle'}
								/>
							</Card>
						))}
					</Stack>
				</Radio.Group>
			);
		}

		return (
			<Stack gap='sm'>
				{currentQuestion.options.map(option => (
					<Card
						key={option.id}
						withBorder
						shadow='xs'
						style={{
							borderColor: selectedOptions.includes(option.id)
								? 'var(--mantine-color-teal-6)'
								: undefined,
						}}
					>
						<Checkbox
							label={option.option_text}
							checked={selectedOptions.includes(option.id)}
							onChange={() => toggleOption(option.id)}
							disabled={answerState !== 'idle'}
						/>
					</Card>
				))}
			</Stack>
		);
	};

	const explanation =
		answerState !== 'idle' && currentQuestion ? (
			<Alert
				icon={answerState === 'correct' ? <IconCheck size={16} /> : <IconX size={16} />}
				color={answerState === 'correct' ? 'teal' : 'red'}
				title={answerState === 'correct' ? 'Верно!' : 'Неверно'}
			>
				<Text size='sm'>{currentQuestion.explanation}</Text>
			</Alert>
		) : null;

	if (isLoading) {
		return (
			<Container size='sm' py='xl'>
				<Stack align='center' gap='sm'>
					<Loader color='teal' />
					<Text c='dimmed'>Загружаем викторину…</Text>
				</Stack>
			</Container>
		);
	}

	if (error) {
		return (
			<Container size='sm' py='xl'>
				<Alert color='red' title='Ошибка' variant='filled'>
					{error}
				</Alert>
			</Container>
		);
	}

	if (!quiz || !currentQuestion) {
		return (
			<Container size='sm' py='xl'>
				<Alert color='yellow' title='Нет данных' variant='light'>
					Викторины пока недоступны. Загляните позже.
				</Alert>
			</Container>
		);
	}

	if (isFinished) {
		const correctAnswers = Object.values(history).filter(item => item.isCorrect).length;

		return (
			<Container size='sm' py='xl'>
				<Card withBorder radius='lg' padding='xl' shadow='md'>
					<Stack gap='md' align='center'>
						<Title order={2}>Тест завершён</Title>
						<Text size='lg' fw={600}>
							{correctAnswers} из {totalQuestions} правильных ответов
						</Text>
						<Group>
							<Badge size='lg' leftSection={<IconCoin size={16} />} color='teal'>
								+{coins} репкоин(ов)
							</Badge>
						</Group>
						<Button leftSection={<IconRefresh size={16} />} onClick={restartQuiz}>
							Пройти ещё раз
						</Button>
					</Stack>
				</Card>
			</Container>
		);
	}

	return (
		<Container size='sm' py='xl'>
			<Stack gap='lg'>
				<div>
					<Title order={2}>{quiz.title}</Title>
					<Text c='dimmed'>{quiz.description}</Text>
				</div>

				<Card withBorder radius='lg' padding='lg' shadow='sm'>
					<Group justify='space-between' align='flex-end'>
						<div>
							<Text fw={600}>
								Вопрос {currentQuestionIndex + 1} / {totalQuestions}
							</Text>
							<Text c='dimmed' size='sm'>
								{currentQuestion.question_text}
							</Text>
						</div>

						<Group gap='xs'>
							<Badge color='teal' variant='light' leftSection={<IconCoin size={14} />}>
								Монеты: {coins}
							</Badge>
							{currentQuestion.timer_seconds && (
								<Badge
									color={remainingTime !== null && remainingTime <= 5 ? 'red' : 'gray'}
									variant='light'
									leftSection={<IconClockHour4 size={14} />}
								>
									{remainingTime ?? currentQuestion.timer_seconds} c
								</Badge>
							)}
						</Group>
					</Group>

					<Text size='sm' c='dimmed' mt='md' mb='xs'>
						{currentQuestion.question_type === 'multiple_choice'
							? 'Выберите один или несколько вариантов'
							: 'Выберите один вариант ответа'}
					</Text>

					{renderOptions()}

					<Stack gap='sm' mt='md'>
						<Group>
							<Button
								onClick={handleCheck}
								disabled={answerState !== 'idle' || selectedOptions.length === 0}
							>
								Проверить ответ
							</Button>
							<Button
								variant='light'
								onClick={goToNextQuestion}
								disabled={answerState === 'idle'}
							>
								{currentQuestionIndex === totalQuestions - 1 ? 'Завершить' : 'Далее'}
							</Button>
						</Group>
						{explanation}
					</Stack>
				</Card>

				<Card withBorder radius='md' padding='md'>
					<Group justify='space-between'>
						<Text size='sm' fw={600}>
							Прогресс теста
						</Text>
						<Text size='sm' c='dimmed'>
							{Math.round(questionProgress)}%
						</Text>
					</Group>
					<Progress value={questionProgress} mt='xs' radius='xl' />
				</Card>
			</Stack>
		</Container>
	);
};

export default QuizPage;
