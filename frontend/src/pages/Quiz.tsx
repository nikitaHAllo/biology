// pages/QuizPage.tsx
import { useState } from 'react';
import { Loader, Alert, Card, Group, Button, Stack } from '@mantine/core';
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

	// Деструктуризация нужных свойств из хука
	const {
		isLoading,
		error,
		newQuizzes,
		completedQuizzes,
		currentQuestion,
		currentQuestionIndex,
		totalQuestions,
		answerState,
		isFinished,
		selectedOptions,
		coins,
		history,
		progress,
		currentQuizIndex,
		totalQuizzes,
		quizzes,
		hasNextQuiz,
		switchList,
		switchQuiz,
		checkAnswer,
		next,
		restart,
		nextQuiz,
		prevQuiz,
		toggleOption,
		handleTimeout,
	} = useQuiz(user);

	const timer = useTimer({
		initialTime: currentQuestion?.timer_seconds ?? null,
		active: answerState === 'idle' && !isFinished,
		onTimeout: handleTimeout,
	});

	const [activeTab, setActiveTab] = useState<'new' | 'completed'>('new');

	if (isLoading) return <Loader />;
	if (error) return <Alert color='red'>{error}</Alert>;

	// Обработчик переключения вкладок
	const handleSwitchTab = async (tab: 'new' | 'completed') => {
		setActiveTab(tab);
		await switchList(tab);
	};

	// Проверка пустых списков
	const currentList = activeTab === 'new' ? newQuizzes : completedQuizzes;
	const isListEmpty = !currentList || currentList.length === 0;

	// Результат теста
	if (isFinished) {
		const correct = Object.values(history).filter(x => x.isCorrect).length;
		const percentage = Math.round((correct / totalQuestions) * 100);
		const isSuccess = percentage >= 70;

		return (
			<QuizLayout>
				<QuizResult
					correct={correct}
					total={totalQuestions}
					coins={coins}
					restart={restart}
					onNextQuiz={nextQuiz}
					hasNextQuiz={hasNextQuiz && isSuccess}
					score={correct}
				/>
			</QuizLayout>
		);
	}

	return (
		<QuizLayout>
			{/* Вкладки переключения */}
			<Card withBorder padding='md' mb='md'>
				<Group>
					<Button
						variant={activeTab === 'new' ? 'filled' : 'light'}
						onClick={() => handleSwitchTab('new')}
					>
						Новые тесты ({newQuizzes?.length || 0})
					</Button>
					<Button
						variant={activeTab === 'completed' ? 'filled' : 'light'}
						onClick={() => handleSwitchTab('completed')}
					>
						Пройденные ({completedQuizzes?.length || 0})
					</Button>
				</Group>
			</Card>

			{/* Сообщение если список пуст */}
			{isListEmpty ? (
				<Card withBorder padding='lg'>
					<Alert color='blue' variant='outline'>
						{activeTab === 'new'
							? 'Нет доступных тестов для прохождения'
							: 'Вы ещё не прошли ни одного теста'}
					</Alert>
				</Card>
			) : (
				<>
					{/* Навигация по тестам */}
					{totalQuizzes > 1 && (
						<Card withBorder padding='md' mb='md'>
							<QuizNavigation
								currentQuizIndex={currentQuizIndex}
								totalQuizzes={totalQuizzes}
								onPrev={prevQuiz}
								onNext={nextQuiz}
								onSelect={switchQuiz}
								quizzes={quizzes}
							/>
						</Card>
					)}

					{/* Вопросы текущего теста */}
					{currentQuestion && (
						<Stack gap='md'>
							{/* Заголовок вопроса */}
							<Card withBorder padding='lg'>
								<QuizHeader
									index={currentQuestionIndex}
									total={totalQuestions}
									coins={coins}
									question={currentQuestion.question_text}
									time={timer.time}
								/>
							</Card>

							{/* Варианты ответов */}
							<Card withBorder padding='lg'>
								<QuizOptions
									question={currentQuestion}
									selected={selectedOptions}
									disabled={answerState !== 'idle'}
									toggle={toggleOption}
								/>
							</Card>

							{/* Объяснение */}
							{answerState !== 'idle' && currentQuestion.explanation && (
								<QuizExplanation
									state={answerState}
									text={currentQuestion.explanation}
								/>
							)}

							{/* Кнопки управления */}
							<Card withBorder padding='lg'>
								<QuizFooter
									canCheck={
										selectedOptions.length > 0 && answerState === 'idle'
									}
									canNext={answerState !== 'idle'}
									onCheck={() => {
										checkAnswer();
										timer.stop();
									}}
									onNext={next}
									isLast={currentQuestionIndex === totalQuestions - 1}
								/>
							</Card>

							{/* Прогресс */}
							<Card withBorder padding='lg'>
								<QuizProgress value={progress} />
							</Card>
						</Stack>
					)}
				</>
			)}
		</QuizLayout>
	);
};

export default QuizPage;
