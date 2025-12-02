// pages/QuizPage.tsx
import { Loader, Alert, Card } from '@mantine/core';
import {
	QuizExplanation,
	QuizFooter,
	QuizHeader,
	QuizOptions,
	QuizProgress,
	QuizResult,
	QuizLayout,
	QuizNavigation,
} from '../components';
import { useQuiz, useTelegram, useTimer } from '../hooks';

const QuizPage = () => {
	const { user } = useTelegram();
	const quiz = useQuiz(user);

	const timer = useTimer({
		initialTime: quiz.currentQuestion?.timer_seconds ?? null,
		active: quiz.answerState === 'idle' && !quiz.isFinished,
		onTimeout: quiz.handleTimeout,
	});

	if (quiz.isLoading) return <Loader />;
	if (quiz.error) return <Alert color='red'>{quiz.error}</Alert>;

	if (quiz.isFinished) {
		const correct = Object.values(quiz.history).filter(x => x.isCorrect).length;
		const percentage = Math.round((correct / quiz.totalQuestions) * 100);
		const isSuccess = percentage >= 70;

		return (
			<QuizLayout>
				<QuizResult
					correct={correct}
					total={quiz.totalQuestions}
					coins={quiz.coins}
					restart={quiz.restart}
					onNextQuiz={quiz.nextQuiz}
					hasNextQuiz={quiz.hasNextQuiz && isSuccess}
					score={correct}
				/>
			</QuizLayout>
		);
	}

	const q = quiz.currentQuestion;

	return (
		<QuizLayout gap='xs'>
			{/* Навигация по тестам */}
			{quiz.quizzes.length > 1 && (
				<Card withBorder padding='md' radius='lg'>
					<QuizNavigation
						currentQuizIndex={quiz.currentQuizIndex}
						totalQuizzes={quiz.totalQuizzes}
						onPrev={quiz.prevQuiz}
						onNext={quiz.nextQuiz}
						onSelect={quiz.switchQuiz} // ← исправлено с selectQuiz на switchQuiz
						quizzes={quiz.quizzes}
					/>
				</Card>
			)}

			{/* Заголовок викторины */}
			<Card withBorder padding='lg' radius='lg'>
				<QuizHeader
					index={quiz.currentQuestionIndex}
					total={quiz.totalQuestions}
					coins={quiz.coins}
					question={q!.question_text}
					time={timer.time}
				/>
			</Card>

			{/* Варианты ответов */}
			<Card withBorder padding='lg' radius='lg'>
				<QuizOptions
					question={q!}
					selected={quiz.selectedOptions}
					disabled={quiz.answerState !== 'idle'}
					toggle={quiz.toggleOption}
				/>
			</Card>

			{/* Объяснение */}
			{quiz.answerState !== 'idle' && (
				<QuizExplanation state={quiz.answerState} text={q!.explanation} />
			)}

			{/* Кнопки управления */}
			<Card withBorder padding='lg' radius='lg'>
				<QuizFooter
					canCheck={
						quiz.selectedOptions.length > 0 && quiz.answerState === 'idle'
					}
					canNext={quiz.answerState !== 'idle'}
					onCheck={() => {
						quiz.checkAnswer();
						timer.stop();
					}}
					onNext={() => {
						quiz.next();
					}}
					isLast={quiz.currentQuestionIndex === quiz.totalQuestions - 1}
				/>
			</Card>

			{/* Прогресс-бар */}
			<Card withBorder padding='lg' radius='lg'>
				<QuizProgress value={quiz.progress} />
			</Card>
		</QuizLayout>
	);
};

export default QuizPage;
