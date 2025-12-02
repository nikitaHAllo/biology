import { Container, Stack } from '@mantine/core';
import type { ReactNode } from 'react';

interface QuizLayoutProps {
	children: ReactNode;
	gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const QuizLayout = ({ children, gap = 'lg' }: QuizLayoutProps) => (
	<Container size='sm' py='xl'>
		<Stack gap={gap}>{children}</Stack>
	</Container>
);
