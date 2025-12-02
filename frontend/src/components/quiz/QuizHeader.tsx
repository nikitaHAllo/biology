import { Badge, Group, Text } from '@mantine/core';
import { IconCoin, IconClockHour4 } from '@tabler/icons-react';

export const QuizHeader = ({
	index,
	total,
	coins,
	question,
	time,
}: {
	index: number;
	total: number;
	coins: number;
	question: string;
	time: number | null;
}) => (
	<Group justify='space-between'>
		<div>
			<Text fw={600}>
				Вопрос {index + 1} / {total}
			</Text>
			<Text c='dimmed'>{question}</Text>
		</div>

		<Group>
			<Badge leftSection={<IconCoin size={14} />} color='teal'>
				{coins}
			</Badge>
			{time !== null && (
				<Badge
					leftSection={<IconClockHour4 size={14} />}
					color={time <= 5 ? 'red' : 'gray'}
				>
					{time} c
				</Badge>
			)}
		</Group>
	</Group>
);
