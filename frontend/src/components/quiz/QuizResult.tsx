import { Badge, Button, Card, Stack, Text, Title } from '@mantine/core';
import { IconCoin, IconRefresh } from '@tabler/icons-react';

export const QuizResult = ({
	correct,
	total,
	coins,
	restart,
}: {
	correct: number;
	total: number;
	coins: number;
	restart: () => void;
}) => (
	<Card withBorder padding='xl'>
		<Stack align='center'>
			<Title order={2}>Тест завершён</Title>
			<Text>
				{correct} из {total}
			</Text>

			<Badge leftSection={<IconCoin size={16} />} color='teal'>
				+{coins}
			</Badge>

			<Button leftSection={<IconRefresh size={16} />} onClick={restart}>
				Пройти ещё раз
			</Button>
		</Stack>
	</Card>
);
