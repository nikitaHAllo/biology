import { useEffect, useState, useMemo } from 'react';
import { apiService } from '../../api';
import type { Quiz, QuizQuestion } from '../../models';

export type AnswerState = 'idle' | 'correct' | 'incorrect' | 'timeout';

export const useQuiz = (user: { id: number } | null) => {
	const [quiz, setQuiz] = useState<Quiz | null>(null);
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

	// --------------------------
	// LOAD QUIZ
	// --------------------------
	useEffect(() => {
		const load = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const list = await apiService.getQuizzesList();
				console.log(list);
				const first = list[0];

				if (!first) {
					setError('Нет доступных викторин');
					return;
				}

				const details = await apiService.getQuizDetails(first.id);
				setQuiz(details);
			} catch {
				setError('Ошибка загрузки викторины');
			} finally {
				setIsLoading(false);
			}
		};

		load();
	}, []);

	// --------------------------
	// TOGGLE OPTION
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

	// --------------------------
	// CHECK ANSWER
	// --------------------------
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

	// --------------------------
	// HANDLE TIMEOUT
	// --------------------------
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

		// coins уже был накоплен по баллам вопросов
		const earnedCoins = coins;

		const result = await apiService.completeQuiz(quiz.id, {
			telegramId: user.id,
			score,
			earned_coins: earnedCoins,
		});

		setCoins(result.earned_coins);
	};

	// --------------------------
	// NEXT QUESTION
	// --------------------------
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

	// --------------------------
	// RESTART QUIZ
	// --------------------------
	const restart = () => {
		setCurrentQuestionIndex(0);
		setSelectedOptions([]);
		setAnswerState('idle');
		setHistory({});
		setCoins(0);
		setIsFinished(false);
	};

	// --------------------------
	// PROGRESS
	// --------------------------
	const progress = useMemo(() => {
		const answered = Object.keys(history).length;
		return totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0;
	}, [history, totalQuestions]);

	return {
		quiz,
		error,
		isLoading,

		currentQuestion,
		currentQuestionIndex,
		totalQuestions,

		selectedOptions,
		setSelectedOptions,

		toggleOption,
		checkAnswer,
		handleTimeout,

		answerState,
		setAnswerState,

		history,
		coins,

		next,
		restart,
		isFinished,

		progress,
	};
};
