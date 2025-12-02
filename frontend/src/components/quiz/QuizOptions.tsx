import { Card, Checkbox, Radio, Stack } from '@mantine/core';
import type { QuizQuestion } from '../../models/quiz';

export const QuizOptions = ({
	question,
	selected,
	disabled,
	toggle,
}: {
	question: QuizQuestion;
	selected: number[];
	disabled: boolean;
	toggle: (id: number) => void;
}) => {
	const isSingle = question.question_type !== 'multiple_choice';

	if (isSingle) {
		return (
			<Radio.Group
				value={selected[0]?.toString() ?? ''}
				onChange={v => toggle(Number(v))}
			>
				<Stack>
					{question.options.map(o => (
						<Card key={o.id} withBorder shadow='xs'>
							<Radio
								value={o.id.toString()}
								label={o.option_text}
								disabled={disabled}
							/>
						</Card>
					))}
				</Stack>
			</Radio.Group>
		);
	}

	return (
		<Stack>
			{question.options.map(o => (
				<Card key={o.id} withBorder shadow='xs'>
					<Checkbox
						checked={selected.includes(o.id)}
						onChange={() => toggle(o.id)}
						label={o.option_text}
						disabled={disabled}
					/>
				</Card>
			))}
		</Stack>
	);
};
