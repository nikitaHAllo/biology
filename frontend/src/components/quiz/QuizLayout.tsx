import { Card, Container, Stack } from '@mantine/core';
import type { ReactNode } from 'react';


export const QuizLayout = ({ children }: { children: ReactNode }) => (
	<Container size='sm' py='xl'>
		<Stack gap='lg'>
			<Card withBorder radius='lg' padding='lg' shadow='sm'>
				{children}
			</Card>
		</Stack>
	</Container>
);
