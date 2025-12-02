import { Loader, Alert, Card } from '@mantine/core';
import {
	QuizExplanation,
	QuizFooter,
	QuizHeader,
	QuizOptions,
	QuizProgress,
	QuizResult,
	QuizLayout,
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
		return (
			<QuizLayout>
				<QuizResult
					correct={correct}
					total={quiz.totalQuestions}
					coins={quiz.coins}
					restart={quiz.restart}
				/>
			</QuizLayout>
		);
	}

	const q = quiz.currentQuestion;

	return (
		<QuizLayout gap='xl'>
			{/* Заголовок викторины в карточке */}
			<Card withBorder radius='lg' padding='lg' shadow='sm'>
				<QuizHeader
					index={quiz.currentQuestionIndex}
					total={quiz.totalQuestions}
					coins={quiz.coins}
					question={q!.question_text}
					time={timer.time}
				/>
			</Card>

			{/* Варианты ответов в карточке */}
			<Card withBorder radius='lg' padding='lg' shadow='sm'>
				<QuizOptions
					question={q!}
					selected={quiz.selectedOptions}
					disabled={quiz.answerState !== 'idle'}
					toggle={quiz.toggleOption}
				/>
			</Card>

			{/* Объяснение (показывается только после ответа) */}
			{quiz.answerState !== 'idle' && (
				<QuizExplanation state={quiz.answerState} text={q!.explanation} />
			)}

			{/* Кнопки управления в карточке */}
			<Card withBorder radius='lg' padding='lg' shadow='sm'>
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

			{/* Прогресс-бар в карточке */}
			<Card withBorder radius='lg' padding='lg' shadow='sm'>
				<QuizProgress value={quiz.progress} />
			</Card>
		</QuizLayout>
	);
};

export default QuizPage;
