import {
	Card,
	Group,
	Text,
	Badge,
	Button,
	Progress,
	Alert,
} from '@mantine/core';
import { IconBook2, IconPlayerPlay, IconCoin } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import type { Quiz } from '../../models';

interface FeaturedQuizProps {
	quiz: Quiz | null;
}

export function FeaturedQuiz({ quiz }: FeaturedQuizProps) {
	const navigate = useNavigate();
	if (!quiz) return <Alert color='yellow'>Викторины скоро появятся</Alert>;

	return (
		<Card withBorder radius='lg' padding='lg' shadow='sm'>
			<Group justify='space-between' align='flex-start' mb='md'>
				<div>
					<Group gap='xs'>
						<IconBook2 size={18} />
						<Text fw={600}>{quiz.title}</Text>
					</Group>
					<Text c='dimmed' size='sm'>
						{quiz.description}
					</Text>
					<Group gap='xs' mt='xs'>
						<Badge variant='light'>{quiz.total_questions} вопросов</Badge>
						{quiz.estimated_minutes && (
							<Badge variant='light'>{quiz.estimated_minutes} мин.</Badge>
						)}
						<Badge variant='light' leftSection={<IconCoin size={14} />}>
							+1 репкоин
						</Badge>
					</Group>
				</div>
				<Button
					size='md'
					leftSection={<IconPlayerPlay size={16} />}
					onClick={() => navigate('/quiz')}
				>
					Начать тест
				</Button>
			</Group>

			<Progress
				value={(1 / quiz.total_questions) * 100}
				color='violet'
				radius='xl'
				size='lg'
			/>
			<Text size='sm' c='dimmed' mt='xs'>
				3 типа вопросов, таймер, задания
			</Text>
		</Card>
	);
}
