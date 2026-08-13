// pages/QuizPage.tsx
import { useState, useEffect } from 'react';
import {
	Loader, Alert, Card, Group, Button, Stack, Text, Badge, ThemeIcon,
	ScrollArea, Title,
} from '@mantine/core';
import {
	QuizExplanation,
	QuizFooter,
	QuizHeader,
	QuizOptions,
	QuizProgress,
	QuizResult,
	QuizLayout,
	QuizNavigation,
	OpenAnswerInput,
} from '../components';
import { IconCheck, IconEye } from '@tabler/icons-react';
import { useQuiz, useTelegram, useTimer } from '../hooks';
import { useUserData } from '../hooks/useUserData';

const QuizPage = () => {
	const { user } = useTelegram();

	const {
		isLoading,
		error,
		newQuizzes,
		completedQuizzes,
		activeList,
		categories,
		selectedCategoryId,
		setSelectedCategoryId,
		currentQuestion,
		currentQuestionIndex,
		totalQuestions,
		answerState,
		isFinished,
		finishSnapshot,
		selectedOptions,
		coins,
		progress,
		currentQuizIndex,
		totalQuizzes,
		quizzes,
		hasNextQuiz,
		switchList,
		switchQuiz,
		checkAnswer,
		next,
		prevQuestion,
		restart,
		nextQuiz,
		prevQuiz,
		toggleOption,
		handleTimeout,
		quiz,
	} = useQuiz(user);

	const timer = useTimer({
		initialTime: currentQuestion?.timer_seconds ?? null,
		active: answerState === 'idle' && !isFinished && activeList !== 'completed' && currentQuestion?.question_type !== 'open_ended',
		onTimeout: handleTimeout,
	});

	const { profile } = useUserData();
	const [userCoins, setUserCoins] = useState(0);
	useEffect(() => { if (profile?.coins !== undefined) setUserCoins(profile.coins); }, [profile?.coins]);

	const isOpenEnded = currentQuestion?.question_type === 'open_ended';

	const [activeTab, setActiveTab] = useState<'new' | 'completed'>('new');

	if (isLoading) return <Loader />;
	if (error) return <Alert color='red'>{error}</Alert>;

	const handleSwitchTab = async (tab: 'new' | 'completed') => {
		setActiveTab(tab);
		await switchList(tab);
	};

	const currentList = activeTab === 'new' ? newQuizzes : completedQuizzes;
	const isListEmpty = !currentList || currentList.length === 0;
	const isViewOnly = activeList === 'completed';

	if (isFinished && !isViewOnly && finishSnapshot) {
		const { scoredTotal, correct, earnedCoins } = finishSnapshot;

		if (scoredTotal === 0) {
			return (
				<QuizLayout>
					<Card withBorder padding='xl' ta='center'>
						<Stack align='center' gap='md'>
							<ThemeIcon size={64} radius='xl' color='teal' variant='light'>
								<IconCheck size={32} />
							</ThemeIcon>
							<Title order={3}>Ответы записаны!</Title>
							<Text c='dimmed' maw={400}>
								Ваши развёрнутые ответы сохранены. Сверьтесь с пояснением или запросите проверку преподавателя.
							</Text>
							<Button variant='light' color='teal' onClick={restart}>
								Просмотреть и проверить ответы
							</Button>
						</Stack>
					</Card>
				</QuizLayout>
			);
		}

		const isPassed = correct === scoredTotal;
		return (
			<QuizLayout>
				<QuizResult
					correct={correct}
					total={scoredTotal}
					coins={earnedCoins}
					restart={restart}
					onNextQuiz={nextQuiz}
					hasNextQuiz={hasNextQuiz && isPassed}
					score={correct}
				/>
			</QuizLayout>
		);
	}

	return (
		<QuizLayout>
			{/* Category filter */}
			{categories.length > 0 && (
				<Card withBorder padding='sm' mb='sm'>
					<ScrollArea>
						<Group gap='xs' wrap='nowrap'>
							<Button
								size='xs'
								variant={selectedCategoryId === null ? 'filled' : 'light'}
								onClick={() => setSelectedCategoryId(null)}
							>
								Все темы
							</Button>
							{categories.map(cat => (
								<Button
									key={cat.id}
									size='xs'
									variant={selectedCategoryId === cat.id ? 'filled' : 'light'}
									color={cat.color}
									onClick={() => setSelectedCategoryId(cat.id)}
								>
									{cat.title}
								</Button>
							))}
						</Group>
					</ScrollArea>
				</Card>
			)}

			{/* New / Completed tabs */}
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

					{isViewOnly && (
						<Card withBorder padding='sm' mb='md' bg='green.0'>
							<Group gap='xs'>
								<ThemeIcon color='green' variant='light' size='sm'>
									<IconEye size={14} />
								</ThemeIcon>
								<Text size='sm' c='green.8'>
									Режим просмотра — тест пройден
								</Text>
								<Badge color='green' variant='light' size='sm' leftSection={<IconCheck size={10} />}>
									Завершён
								</Badge>
							</Group>
						</Card>
					)}

					{currentQuestion && (
						<Stack gap='md'>
							<Card withBorder padding='lg'>
								<QuizHeader
									index={currentQuestionIndex}
									total={totalQuestions}
									coins={coins}
									question={currentQuestion.question_text}
									time={isViewOnly ? null : timer.time}
								/>
							</Card>

							{currentQuestion.image_url && (
								<Card withBorder padding='md' style={{ textAlign: 'center' }}>
									<img
										src={currentQuestion.image_url}
										alt="Изображение к вопросу"
										style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 8 }}
									/>
								</Card>
							)}

							{isOpenEnded ? (
								<Card withBorder padding='lg'>
									<Text size='sm' c='dimmed' mb='sm'>Развёрнутый ответ (часть 2 ЕГЭ)</Text>
									<OpenAnswerInput
										questionId={currentQuestion.id}
										quizId={quiz!.id}
										userCoins={userCoins}
										onCoinsChanged={setUserCoins}
										explanation={currentQuestion.explanation}
									/>
								</Card>
							) : (
								<Card withBorder padding='lg'>
									<QuizOptions
										question={currentQuestion}
										selected={isViewOnly ? currentQuestion.correct_answer_ids : selectedOptions}
										disabled={isViewOnly || answerState !== 'idle'}
										toggle={toggleOption}
									/>
								</Card>
							)}

							{!isViewOnly && !isOpenEnded && answerState !== 'idle' && currentQuestion.explanation && (
								<QuizExplanation
									state={answerState}
									text={currentQuestion.explanation}
								/>
							)}

							{isViewOnly && currentQuestion.explanation && (
								<Card withBorder padding='md' bg='blue.0'>
									<Text size='sm' c='blue.8'>{currentQuestion.explanation}</Text>
								</Card>
							)}

							{isViewOnly ? (
								<Card withBorder padding='lg'>
									<Group justify='space-between'>
										<Button
											variant='light'
											disabled={currentQuestionIndex === 0}
											onClick={prevQuestion}
										>
											← Назад
										</Button>
										<Text size='sm' c='dimmed'>
											{currentQuestionIndex + 1} / {totalQuestions}
										</Text>
										<Button
											variant='light'
											disabled={currentQuestionIndex >= totalQuestions - 1}
											onClick={next}
										>
											Вперёд →
										</Button>
									</Group>
								</Card>
							) : (
								<Card withBorder padding='lg'>
									{isOpenEnded ? (
										<Group justify='flex-end'>
											<Button variant='light' onClick={next}>
												{currentQuestionIndex === totalQuestions - 1 ? 'Завершить →' : 'Далее →'}
											</Button>
										</Group>
									) : (
										<QuizFooter
											canCheck={selectedOptions.length > 0 && answerState === 'idle'}
											canNext={answerState !== 'idle'}
											onCheck={() => {
												checkAnswer();
												timer.stop();
											}}
											onNext={next}
											isLast={currentQuestionIndex === totalQuestions - 1}
										/>
									)}
								</Card>
							)}

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
