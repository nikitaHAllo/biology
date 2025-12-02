import { Button, Group } from '@mantine/core';

export const QuizFooter = ({
	canCheck,
	canNext,
	onCheck,
	onNext,
	isLast,
}: {
	canCheck: boolean;
	canNext: boolean;
	onCheck: () => void;
	onNext: () => void;
	isLast: boolean;
}) => (
	<Group mt='md'>
		<Button onClick={onCheck} disabled={!canCheck}>
			Проверить ответ
		</Button>

		<Button variant='light' onClick={onNext} disabled={!canNext}>
			{isLast ? 'Завершить' : 'Далее'}
		</Button>
	</Group>
);
