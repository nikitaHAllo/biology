import { Card, Group, Progress, Text } from '@mantine/core';

export const QuizProgress = ({ value }: { value: number }) => (
	<Card withBorder>
		<Group justify='space-between'>
			<Text fw={600}>Прогресс</Text>
			<Text>{Math.round(value)}%</Text>
		</Group>
		<Progress value={value} mt='xs' />
	</Card>
);
