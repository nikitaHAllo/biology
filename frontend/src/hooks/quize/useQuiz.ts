// hooks/useQuiz.ts
import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Quiz, QuizCategory, QuizQuestion } from '../../models';
import { apiService } from '../../api';

export type AnswerState = 'idle' | 'correct' | 'incorrect' | 'timeout';

export const useQuiz = (user: { id: number } | null) => {
	const [activeList, setActiveList] = useState<'new' | 'completed'>('new');
	const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
	const [categories, setCategories] = useState<QuizCategory[]>([]);

	const [allNewQuizzes, setAllNewQuizzes] = useState<Quiz[]>([]);
	const [allCompletedQuizzes, setAllCompletedQuizzes] = useState<Quiz[]>([]);
	const [quiz, setQuiz] = useState<Quiz | null>(null);
	const [currentQuizIndex, setCurrentQuizIndex] = useState(0);

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

	// Filtered by selected category
	const newQuizzes = useMemo(
		() => allNewQuizzes.filter(q => !selectedCategoryId || q.category_id === selectedCategoryId),
		[allNewQuizzes, selectedCategoryId]
	);
	const completedQuizzes = useMemo(
		() => allCompletedQuizzes.filter(q => !selectedCategoryId || q.category_id === selectedCategoryId),
		[allCompletedQuizzes, selectedCategoryId]
	);

	const currentList = activeList === 'new' ? newQuizzes : completedQuizzes;
	const currentQuestion = quiz?.questions[currentQuestionIndex];
	const totalQuestions = quiz?.questions.length ?? 0;
	const totalQuizzes = currentList.length;

	// --------------------------
	// LOAD QUIZZES + CATEGORIES
	// --------------------------
	const loadQuizzes = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const [list, catData] = await Promise.all([
				apiService.getQuizzesList(user?.id),
				apiService.getQuizCategories(),
			]);

			const newList = list.filter(q => !q.is_completed);
			const completedList = list.filter(q => q.is_completed);

			setAllNewQuizzes(newList);
			setAllCompletedQuizzes(completedList);
			setCategories(catData.categories);
			setActiveList('new');

			if (!list || list.length === 0) {
				setError('Нет доступных тестов');
				return;
			}

			const first = newList[0] || list[0];
			const details = await apiService.getQuizDetails(first.id);
			setQuiz(details);
			setCurrentQuizIndex(0);
		} catch {
			setError('Ошибка загрузки тестов');
		} finally {
			setIsLoading(false);
		}
	}, [user?.id]);

	useEffect(() => {
		loadQuizzes();
	}, [loadQuizzes]);

	// When category filter changes, reset to first quiz in filtered list
	useEffect(() => {
		const list = activeList === 'new' ? newQuizzes : completedQuizzes;
		if (list.length === 0) {
			setCurrentQuizIndex(0);
			return;
		}
		setCurrentQuizIndex(0);
		apiService.getQuizDetails(list[0].id).then(details => {
			setQuiz(details);
			resetQuizState();
		}).catch(() => {});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCategoryId, activeList]);

	// --------------------------
	// SWITCH QUIZ FUNCTIONS
	// --------------------------
	const switchQuiz = useCallback(
		async (quizId: number) => {
			const quizDetails = await apiService.getQuizDetails(quizId);
			setQuiz(quizDetails);

			const newIndex = currentList.findIndex(q => q.id === quizId);
			if (newIndex !== -1) setCurrentQuizIndex(newIndex);

			resetQuizState();
		},
		[currentList]
	);

	const nextQuiz = useCallback(async () => {
		if (currentQuizIndex >= totalQuizzes - 1) return;

		const nextQuizId = currentList[currentQuizIndex + 1].id;
		await switchQuiz(nextQuizId);
	}, [currentQuizIndex, totalQuizzes, currentList, switchQuiz]);

	const prevQuiz = useCallback(async () => {
		if (currentQuizIndex <= 0) return;

		const prevQuizId = currentList[currentQuizIndex - 1].id;
		await switchQuiz(prevQuizId);
	}, [currentQuizIndex, currentList, switchQuiz]);

	const resetQuizState = () => {
		setCurrentQuestionIndex(0);
		setSelectedOptions([]);
		setAnswerState('idle');
		setHistory({});
		setCoins(0);
		setIsFinished(false);
	};

	// --------------------------
	// QUESTION LOGIC
	// --------------------------
	const toggleOption = (id: number) => {
		if (!currentQuestion || answerState !== 'idle') return;

		const isSingle =
			currentQuestion.question_type === 'single_choice' ||
			currentQuestion.question_type === 'true_false';

		setSelectedOptions(prev => {
			if (isSingle) return [id];
			if (prev.includes(id)) return prev.filter(x => x !== id);
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

	const switchList = async (listName: 'new' | 'completed') => {
		setActiveList(listName);

		const list = listName === 'new' ? newQuizzes : completedQuizzes;
		if (list.length === 0) return;

		setCurrentQuizIndex(0);
		const details = await apiService.getQuizDetails(list[0].id);
		setQuiz(details);
		resetQuizState();
	};

	const finishQuiz = async () => {
		if (!quiz) return;

		const score = Object.values(history).filter(h => h.isCorrect).length;
		const earnedCoins = coins;

		const result = await apiService.completeQuiz(quiz.id, {
			telegramId: user?.id,
			score,
			earned_coins: earnedCoins,
		});
		console.log(result);
		setCoins(result.earned_coins ?? 0);
		await loadQuizzes();
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

	const prevQuestion = () => {
		if (currentQuestionIndex <= 0) return;
		setCurrentQuestionIndex(i => i - 1);
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

	const hasNextQuiz = useMemo(() => currentQuizIndex < totalQuizzes - 1, [currentQuizIndex, totalQuizzes]);
	const hasPrevQuiz = useMemo(() => currentQuizIndex > 0, [currentQuizIndex]);

	const quizzesInfo = useMemo(
		() => currentList.map((q, index) => ({
			id: q.id,
			title: q.title,
			description: q.description,
			isCurrent: index === currentQuizIndex,
		})),
		[currentList, currentQuizIndex]
	);

	return {
		quiz,
		newQuizzes,
		completedQuizzes,
		activeList,
		switchList,
		categories,
		selectedCategoryId,
		setSelectedCategoryId,
		quizzes: quizzesInfo,
		currentQuizIndex,
		totalQuizzes,

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

		hasNextQuiz,
		hasPrevQuiz,
		nextQuiz,
		prevQuiz,
		switchQuiz,

		toggleOption,
		checkAnswer,
		handleTimeout,
		next,
		prevQuestion,
		restart,

		progress,
	};
};
