// QuizExplanation.tsx (обновленная версия)
import { Alert, Text, Card } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import type { AnswerState } from '../../hooks/quize/useQuiz';

export const QuizExplanation = ({
	state,
	text,
}: {
	state: AnswerState;
	text: string | undefined;
}) => {
	if (state === 'idle' || !text) return null;

	const isCorrect = state === 'correct';

	return (
		<Card withBorder radius='lg' padding='lg' shadow='sm'>
			<Alert
				icon={isCorrect ? <IconCheck size={16} /> : <IconX size={16} />}
				color={isCorrect ? 'teal' : 'red'}
				title={isCorrect ? 'Верно!' : 'Неверно'}
			>
				<Text size='sm'>{text}</Text>
			</Alert>
		</Card>
	);
};
