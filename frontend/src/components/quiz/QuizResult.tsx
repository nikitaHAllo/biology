// components/QuizResult.tsx
import { Badge, Button, Card, Stack, Text, Title, Group } from '@mantine/core';
import { IconCoin, IconRefresh, IconArrowRight, IconTrophy } from '@tabler/icons-react';

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
	const isSuccess = correct === total; // все верно = успешно пройден

	return (
		<Card withBorder padding='xl' radius='lg'>
			<Stack align='center' gap='md'>
				<Title order={2} c={isSuccess ? 'teal' : 'orange'}>
					{isSuccess ? '🎉 Тест пройден!' : '📝 Не все ответы верны'}
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

				{isSuccess && coins > 0 && (
					<Badge leftSection={<IconCoin size={16} />} color='teal' size='lg'>
						+{coins} монет
					</Badge>
				)}

				<Group justify='center' mt='md'>
					<Button
						leftSection={<IconRefresh size={16} />}
						onClick={restart}
						variant='light'
						color={isSuccess ? 'blue' : 'orange'}
					>
						{isSuccess ? 'Повторить' : 'Перепройти'}
					</Button>

					{hasNextQuiz && onNextQuiz && isSuccess && (
						<Button
							rightSection={<IconArrowRight size={16} />}
							onClick={onNextQuiz}
							color='teal'
						>
							Следующий тест
						</Button>
					)}
				</Group>

				<Text size='sm' c={isSuccess ? 'teal' : 'orange'} ta='center'>
					{isSuccess
						? 'Отличный результат! Тест засчитан как пройденный.'
						: 'Нужно ответить верно на все вопросы. Попробуйте ещё раз — монеты будут начислены после полного прохождения.'}
				</Text>

				{isSuccess && (
					<Badge color='teal' variant='light' leftSection={<IconTrophy size={12} />}>
						Тест добавлен в «Пройденные»
					</Badge>
				)}
			</Stack>
		</Card>
	);
};
