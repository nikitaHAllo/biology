// hooks/useQuiz.ts
import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Quiz, QuizQuestion } from '../../models';
import { apiService } from '../../api';


export type AnswerState = 'idle' | 'correct' | 'incorrect' | 'timeout';

export const useQuiz = (user: { id: number } | null) => {
	// Основные состояния
	const [quizzes, setQuizzes] = useState<Quiz[]>([]); // ← все тесты
	const [quiz, setQuiz] = useState<Quiz | null>(null); // ← текущий тест
	const [currentQuizIndex, setCurrentQuizIndex] = useState(0); // ← индекс текущего теста

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
	const [answerState, setAnswerState] = useState<AnswerState>('idle');
	const [history, setHistory] = useState<
		Record<number, { selected: number[]; isCorrect: boolean }>
	>({});
	const [coins, setCoins] = useState(0);
	const [isFinished, setIsFinished] = useState(false);

	const currentQuestion = quiz?.questions[currentQuestionIndex];
	const totalQuestions = quiz?.questions.length ?? 0;
	const totalQuizzes = quizzes.length;

	// --------------------------
	// LOAD QUIZZES
	// --------------------------
	useEffect(() => {
		const load = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const list = await apiService.getQuizzesList();
				console.log('Тесты:', list);

				if (!list || list.length === 0) {
					setError('Нет доступных тестов');
					return;
				}

				setQuizzes(list);

				// Загружаем первый тест
				const first = list[0];
				const details = await apiService.getQuizDetails(first.id);
				setQuiz(details);
				setCurrentQuizIndex(0);
			} catch {
				setError('Ошибка загрузки тестов');
			} finally {
				setIsLoading(false);
			}
		};

		load();
	}, []);

	// --------------------------
	// SWITCH QUIZ FUNCTIONS
	// --------------------------
	const switchQuiz = useCallback(
		async (quizId: number) => {
			try {
				setIsLoading(true);

				const quizDetails = await apiService.getQuizDetails(quizId);
				setQuiz(quizDetails);

				// Находим индекс выбранного теста
				const newIndex = quizzes.findIndex(q => q.id === quizId);
				if (newIndex !== -1) {
					setCurrentQuizIndex(newIndex);
				}

				// Сбрасываем состояние теста
				resetQuizState();
			} catch {
				setError('Ошибка загрузки теста');
			} finally {
				setIsLoading(false);
			}
		},
		[quizzes]
	);

	const nextQuiz = useCallback(async () => {
		if (currentQuizIndex >= totalQuizzes - 1) {
			console.log('Это последний тест');
			return;
		}

		const nextQuizId = quizzes[currentQuizIndex + 1].id;
		await switchQuiz(nextQuizId);
	}, [currentQuizIndex, totalQuizzes, quizzes, switchQuiz]);

	const prevQuiz = useCallback(async () => {
		if (currentQuizIndex <= 0) {
			console.log('Это первый тест');
			return;
		}

		const prevQuizId = quizzes[currentQuizIndex - 1].id;
		await switchQuiz(prevQuizId);
	}, [currentQuizIndex, quizzes, switchQuiz]);

	const resetQuizState = () => {
		setCurrentQuestionIndex(0);
		setSelectedOptions([]);
		setAnswerState('idle');
		setHistory({});
		setCoins(0);
		setIsFinished(false);
	};

	// --------------------------
	// QUESTION LOGIC (без изменений)
	// --------------------------
	const toggleOption = (id: number) => {
		if (!currentQuestion || answerState !== 'idle') return;

		const isSingle =
			currentQuestion.question_type === 'single_choice' ||
			currentQuestion.question_type === 'true_false';

		setSelectedOptions(prev => {
			if (isSingle) {
				return [id];
			}

			if (prev.includes(id)) {
				return prev.filter(x => x !== id);
			}

			return [...prev, id];
		});
	};

	const evaluateAnswer = (q: QuizQuestion, answer: number[]) => {
		const a = [...answer].sort();
		const b = [...q.correct_answer_ids].sort();
		return a.length === b.length && a.every((v, i) => v === b[i]);
	};

	const checkAnswer = () => {
		if (!currentQuestion || selectedOptions.length === 0) return;

		const isCorrect = evaluateAnswer(currentQuestion, selectedOptions);

		setAnswerState(isCorrect ? 'correct' : 'incorrect');

		setHistory(prev => ({
			...prev,
			[currentQuestion.id]: { selected: selectedOptions, isCorrect },
		}));

		if (isCorrect) setCoins(c => c + currentQuestion.points || 0);
	};

	const handleTimeout = () => {
		if (!currentQuestion || answerState !== 'idle') return;

		setAnswerState('timeout');

		setHistory(prev => ({
			...prev,
			[currentQuestion.id]: { selected: [], isCorrect: false },
		}));
	};

	const finishQuiz = async () => {
		if (!quiz || !user) return;

		const score = Object.values(history).filter(h => h.isCorrect).length;
		const earnedCoins = coins;

		const result = await apiService.completeQuiz(quiz.id, {
			telegramId: user.id,
			score,
			earned_coins: earnedCoins,
		});
		console.log(result);
		setCoins(result.earned_coins);
	};

	const next = () => {
		if (!quiz) return;

		if (currentQuestionIndex >= totalQuestions - 1) {
			setIsFinished(true);
			finishQuiz();
			return;
		}

		setCurrentQuestionIndex(i => i + 1);
		setSelectedOptions([]);
		setAnswerState('idle');
	};

	const restart = () => {
		resetQuizState();
	};

	// --------------------------
	// PROGRESS
	// --------------------------
	const progress = useMemo(() => {
		const answered = Object.keys(history).length;
		return totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0;
	}, [history, totalQuestions]);

	// Вычисляемые значения для навигации
	const hasNextQuiz = useMemo(() => {
		return currentQuizIndex < totalQuizzes - 1;
	}, [currentQuizIndex, totalQuizzes]);

	const hasPrevQuiz = useMemo(() => {
		return currentQuizIndex > 0;
	}, [currentQuizIndex]);

	const quizzesInfo = useMemo(() => {
		return quizzes.map((q, index) => ({
			id: q.id,
			title: q.title,
			description: q.description,
			isCurrent: index === currentQuizIndex,
		}));
	}, [quizzes, currentQuizIndex]);

	return {
		// Данные
		quiz,
		quizzes: quizzesInfo,
		currentQuizIndex,
		totalQuizzes,

		// Состояния
		error,
		isLoading,
		currentQuestion,
		currentQuestionIndex,
		totalQuestions,
		selectedOptions,
		answerState,
		history,
		coins,
		isFinished,

		// Навигация по тестам
		hasNextQuiz,
		hasPrevQuiz,
		nextQuiz,
		prevQuiz,
		switchQuiz,

		// Функции теста
		toggleOption,
		checkAnswer,
		handleTimeout,
		next,
		restart,

		// Прогресс
		progress,
	};
};
