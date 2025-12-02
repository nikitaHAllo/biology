// components/QuizResult.tsx
import { Badge, Button, Card, Stack, Text, Title, Group } from '@mantine/core';
import { IconCoin, IconRefresh, IconArrowRight } from '@tabler/icons-react';

export const QuizResult = ({
	correct,
	total,
	coins,
	restart,
	onNextQuiz,
	hasNextQuiz = false,
	score = 0,
}: {
	correct: number;
	total: number;
	coins: number;
	restart: () => void;
	onNextQuiz?: () => void;
	hasNextQuiz?: boolean;
	score?: number;
}) => {
	const percentage = Math.round((correct / total) * 100);
	const isSuccess = percentage >= 70; // 70% для успешного прохождения

	return (
		<Card withBorder padding='xl' radius='lg'>
			<Stack align='center' gap='md'>
				<Title order={2} c={isSuccess ? 'teal' : 'orange'}>
					{isSuccess ? '🎉 Тест пройден!' : '📝 Тест завершён'}
				</Title>

				<Group justify='center' gap='xl'>
					<Stack align='center' gap={0}>
						<Text size='xl' fw={700}>
							{correct} / {total}
						</Text>
						<Text size='sm' c='dimmed'>
							правильных ответов
						</Text>
					</Stack>

					<Stack align='center' gap={0}>
						<Text size='xl' fw={700} c={isSuccess ? 'teal' : 'orange'}>
							{percentage}%
						</Text>
						<Text size='sm' c='dimmed'>
							результат
						</Text>
					</Stack>
				</Group>

				{score > 0 && (
					<Badge size='lg' color='yellow' variant='light'>
						Баллы: {score}
					</Badge>
				)}

				<Badge leftSection={<IconCoin size={16} />} color='teal' size='lg'>
					+{coins} монет
				</Badge>

				<Group justify='center' mt='md'>
					{/* Пройти ещё раз */}
					<Button
						leftSection={<IconRefresh size={16} />}
						onClick={restart}
						variant='light'
						color={!isSuccess ? 'orange' : 'blue'}
					>
						{!isSuccess ? 'Перепройти' : 'Повторить'}
					</Button>

					{/* Перейти к следующему тесту */}
					{hasNextQuiz && onNextQuiz && isSuccess && (
						<Button
							rightSection={<IconArrowRight size={16} />}
							onClick={onNextQuiz}
							color='teal'
						>
							Следующий тест
						</Button>
					)}

					{/* Если тест не пройден успешно */}
					{!isSuccess && hasNextQuiz && (
						<Text size='sm' c='dimmed' ta='center'>
							Для перехода к следующему тесту наберите 70% или более
						</Text>
					)}
				</Group>

				{/* Сообщение о результате */}
				<Text size='sm' c={isSuccess ? 'teal' : 'orange'} ta='center'>
					{isSuccess
						? 'Отличный результат! Вы можете перейти к следующему тесту.'
						: 'Попробуйте ещё раз, чтобы улучшить результат!'}
				</Text>
			</Stack>
		</Card>
	);
};
