import React from 'react';
import {
	Card,
	Button,
	Title,
	Text,
	ThemeIcon,
	Container,
	Stack,
	Flex,
	Box,
} from '@mantine/core';
import { Sprout, Dna, Biohazard, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GeneticsGame } from '../components/game/GeneticsGame';

export const ModulesPage: React.FC = () => {
	const navigate = useNavigate();

	const modules = [
		{
			title: 'Биосадовник',
			description:
				'Выращивайте своё виртуальное растение, прокачиваясь в биологии.',
			icon: <Sprout size={40} color='green' />,
			path: '/biogarden',
			color: 'green',
		},
		{
			title: 'Генетический калькулятор',
			description: 'Решайте генетические задачи в интерактивном формате.',
			icon: <Dna size={40} color='blue' />,
			path: '/genetics',
			color: 'blue',
		},
		{
			title: 'Вирусный детектив',
			description:
				'Узнайте, какой патоген вызвал заболевание, анализируя симптомы.',
			icon: <Biohazard size={40} color='red' />,
			path: '/virus',
			color: 'red',
		},
	];

	return (
		<Container size='lg' p='md'>
			<Flex justify='space-between' align='center' mb='xl'>
				<div>
					<Title order={1}>Игровые модули</Title>
					<Text c='dimmed' size='sm' mt={4}>
						Выберите игру, чтобы начать
					</Text>
				</div>

				<ThemeIcon size='xl' radius='md' color='blue'>
					<Sprout size={24} />
				</ThemeIcon>
			</Flex>

			{/* Карточки */}
			<Stack gap='lg' align='center'>
				{modules.map((m, i) => (
					<Box key={i} maw={500} w='100%'>
						<Card
							onClick={() => navigate(m.path)}
							shadow='md'
							radius='xl'
							p='lg'
							style={{
								cursor: 'pointer',
								border: '1px solid var(--mantine-color-gray-3)',
								backgroundColor: 'var(--mantine-color-body)',
							}}
						>
							<Flex align='center' gap='md'>
								<ThemeIcon
									size={60}
									radius='md'
									color={m.color}
									variant='light'
								>
									{m.icon}
								</ThemeIcon>

								<Box style={{ flex: 1 }}>
									<Title order={3} mb={4}>
										{m.title}
									</Title>
									<Text size='sm' c='dimmed'>
										{m.description}
									</Text>
								</Box>
							</Flex>
						</Card>
					</Box>
				))}
			</Stack>
		</Container>
	);
};

const GameWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({
	title,
	children,
}) => {
	const navigate = useNavigate();

	return (
		<Container size='lg' p='md'>
			<Stack gap='md'>
				<Button
					leftSection={<ArrowLeft size={16} />}
					onClick={() => navigate(-1)}
					variant='light'
					style={{ alignSelf: 'flex-start', marginTop: 8 }}
				>
					Назад
				</Button>

				<Title order={1}>{title}</Title>

				<Box
					p='md'
					style={{
						borderRadius: 'var(--mantine-radius-md)',
						border: '1px solid var(--mantine-color-gray-3)',
					}}
				>
					{children}
				</Box>
			</Stack>
		</Container>
	);
};

// Игры
export const BioGardenGame = () => (
	<GameWrapper title='🎍 Биосадовник'>
		<Text size='lg' p='md'>
			Выращивайте своё виртуальное растение, изучая биологию!
		</Text>
	</GameWrapper>
);

export const GeneticCalculator = () => <GeneticsGame />;

export const VirusDetectiveGame = () => (
	<GameWrapper title='🦠 Вирусный детектив'>
		<Text size='lg' p='md'>
			Анализируйте симптомы и определяйте патоген!
		</Text>
	</GameWrapper>
);

export default ModulesPage;
