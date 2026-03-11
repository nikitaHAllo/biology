// components/QuizNavigation.tsx
import { Group, Button, Badge, Text, Tooltip, Flex } from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useState } from 'react';

interface QuizNavigationProps {
	currentQuizIndex: number;
	totalQuizzes: number;
	onPrev: () => void;
	onNext: () => void;
	onSelect?: (quizId: number) => void;
	quizzes?: Array<{
		id: number;
		title: string;
		isCompleted?: boolean;
		// difficulty убрано
	}>;
}

export const QuizNavigation: React.FC<QuizNavigationProps> = ({
	currentQuizIndex,
	totalQuizzes,
	onPrev,
	onNext,
	onSelect,
	quizzes = [],
}) => {
	const [showList, setShowList] = useState(false);

	return (
		<Group justify='center' gap='md'>
			{/* Кнопка предыдущего теста */}
			<Flex gap='sm' align='center'>
				<Button
					variant='light'
					leftSection={<IconArrowLeft size={16} />}
					onClick={onPrev}
					disabled={currentQuizIndex === 0}
					size='sm'
				>
					Предыдущий
				</Button>

				{/* Индикатор текущего теста */}
				<Badge
					variant='outline'
					size='lg'
					style={{ cursor: 'pointer' }}
					onClick={() => quizzes.length > 0 && setShowList(!showList)}
				>
					<Group gap='xs'>
						<Text fw={500}>
							{currentQuizIndex + 1} из {totalQuizzes}
						</Text>
						{/* {quizzes.length > 0 && <IconList size={14} />} */}
					</Group>
				</Badge>

				{/* Кнопка следующего теста */}
				<Button
					variant='light'
					rightSection={<IconArrowRight size={16} />}
					onClick={onNext}
					disabled={currentQuizIndex === totalQuizzes - 1}
					size='sm'
				>
					Следующий
				</Button>
			</Flex>

			{/* Простой список тестов */}
			{showList && quizzes.length > 0 && (
				<Group
					gap='xs'
					mt='md'
					style={{ width: '100%', justifyContent: 'center' }}
				>
					{quizzes.map((quiz, index) => (
						<Tooltip key={quiz.id} label={quiz.title} position='top' withArrow>
							<Badge
								color={
									index === currentQuizIndex
										? 'blue'
										: quiz.isCompleted
										? 'teal'
										: 'gray'
								}
								variant={index === currentQuizIndex ? 'filled' : 'outline'}
								style={{ cursor: 'pointer' }}
								onClick={() => {
									if (onSelect && index !== currentQuizIndex) {
										onSelect(quiz.id);
										setShowList(false);
									}
								}}
							>
								{index + 1}
							</Badge>
						</Tooltip>
					))}
				</Group>
			)}
		</Group>
	);
};
