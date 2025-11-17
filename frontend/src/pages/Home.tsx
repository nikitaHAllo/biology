import React from 'react';
import {
	Container,
	Card,
	Avatar,
	Text,
	Group,
	Badge,
	Progress,
	Stack,
	Grid,
	Title,
	Skeleton,
	Alert,
	Button,
	RingProgress,
	Center,
} from '@mantine/core';
import {
	IconCoin,
	IconTrophy,
	IconBook,
	IconRefresh,
} from '@tabler/icons-react';
import { useTelegram } from '../hooks/useTelegram';
import { useUserData } from '../hooks/useUserData';
import type { Achievement } from '../types/models'; // Правильный импорт
// Правильный импорт

const Profile: React.FC = () => {
	const { user } = useTelegram();
	const { profile, stats, achievements, isLoading, error, refreshData } =
		useUserData();

	if (error) {
		return (
			<Container size='sm' py='xl'>
				<Alert color='red' title='Ошибка' variant='filled'>
					{error}
				</Alert>
			</Container>
		);
	}

	if (!user) {
		return (
			<Container size='sm' py='xl'>
				<Alert color='yellow' title='Внимание' variant='filled'>
					Не удалось получить данные пользователя
				</Alert>
			</Container>
		);
	}

	const completedAchievements: number = achievements.filter(
		(a: Achievement) => a.achieved
	).length;
	const totalAchievements: number = achievements.length;

	return (
		<Container size='sm' py='xl'>
			<Stack gap='lg'>
				<Group justify='space-between'>
					<Title order={1}>Личный кабинет</Title>
					<Button
						leftSection={<IconRefresh size={16} />}
						variant='light'
						onClick={refreshData}
						loading={isLoading}
					>
						Обновить
					</Button>
				</Group>

				<Card shadow='md' padding='lg' radius='md' withBorder>
					<Group wrap='nowrap'>
						<Avatar src={user.photo_url} size={80} radius='md' color='teal'>
							{user.first_name?.[0]}
							{user.last_name?.[0]}
						</Avatar>

						<Stack gap='xs' style={{ flex: 1 }}>
							<div>
								<Text fw={500} size='lg'>
									{user.first_name} {user.last_name || ''}
								</Text>
								{user.username && (
									<Text c='dimmed' size='sm'>
										@{user.username}
									</Text>
								)}
							</div>

							<Group gap='sm'>
								<Badge
									variant='light'
									color='teal'
									leftSection={<IconCoin size={12} />}
								>
									<Skeleton
										visible={isLoading}
										width={isLoading ? 60 : undefined}
									>
										{isLoading
											? 'Загрузка...'
											: `${stats?.total_coins || 0} репкоинов`}
									</Skeleton>
								</Badge>

								<Badge
									variant='light'
									color='blue'
									leftSection={<IconBook size={12} />}
								>
									<Skeleton
										visible={isLoading}
										width={isLoading ? 40 : undefined}
									>
										{isLoading
											? '...'
											: `Уроки: ${stats?.completed_lessons || 0}/${
													stats?.total_lessons || 0
											  }`}
									</Skeleton>
								</Badge>
							</Group>
						</Stack>
					</Group>
				</Card>

				<Grid>
					<Grid.Col span={{ base: 12, md: 6 }}>
						<Card shadow='sm' padding='lg' radius='md' withBorder>
							<Group justify='space-between' mb='xs'>
								<Text fw={500}>Прогресс обучения</Text>
								<RingProgress
									size={60}
									thickness={6}
									roundCaps
									sections={[
										{
											value: stats?.completion_rate || 0,
											color: 'teal',
										},
									]}
									label={
										<Center>
											<Text fw={700} size='xs'>
												{stats?.completion_rate || 0}%
											</Text>
										</Center>
									}
								/>
							</Group>
							<Progress
								value={stats?.completion_rate || 0}
								color='teal'
								size='lg'
								radius='xl'
								mb='sm'
							/>
							<Group justify='apart'>
								<Text size='sm' c='dimmed'>
									Завершено: {stats?.completed_lessons || 0}
								</Text>
								<Text size='sm' c='dimmed'>
									Всего: {stats?.total_lessons || 0}
								</Text>
							</Group>
						</Card>
					</Grid.Col>

					<Grid.Col span={{ base: 12, md: 6 }}>
						<Card shadow='sm' padding='lg' radius='md' withBorder>
							<Group justify='space-between' mb='xs'>
								<Text fw={500}>Достижения</Text>
								<Badge
									variant='light'
									color='yellow'
									leftSection={<IconTrophy size={12} />}
								>
									{completedAchievements}/{totalAchievements}
								</Badge>
							</Group>
							<Progress
								value={
									totalAchievements > 0
										? (completedAchievements / totalAchievements) * 100
										: 0
								}
								color='yellow'
								size='lg'
								radius='xl'
								mb='sm'
							/>
							<Text size='sm' c='dimmed'>
								Получено {completedAchievements} из {totalAchievements}{' '}
								достижений
							</Text>
						</Card>
					</Grid.Col>
				</Grid>

				<Card shadow='sm' padding='md' radius='md' withBorder>
					<Text fw={500} mb='xs'>
						Информация об аккаунте
					</Text>
					<Group justify='apart'>
						<Text size='sm' c='dimmed'>
							Дата регистрации:
						</Text>
						<Text size='sm'>
							{isLoading
								? 'Загрузка...'
								: new Date(profile?.created_at || '').toLocaleDateString(
										'ru-RU'
								  )}
						</Text>
					</Group>
					<Group justify='apart'>
						<Text size='sm' c='dimmed'>
							ID пользователя:
						</Text>
						<Text size='sm'>{user.id}</Text>
					</Group>
				</Card>
			</Stack>
		</Container>
	);
};

export default Profile;
