import React, { useState, useEffect } from 'react';
import {
	Container,
	Card,
	Avatar,
	Text,
	Group,
	Badge,
	Progress,
	Stack,
	Title,
	Skeleton,
	Alert,
	Button,
	RingProgress,
	Center,
	SimpleGrid,
	ThemeIcon,
	Box,
	Divider,
} from '@mantine/core';
import {
	IconCoin,
	IconTrophy,
	IconBook,
	IconRefresh,
	IconFlame,
	IconLeaf,
	IconLock,
	IconCheck,
	IconStar,
	IconAlertCircle,
} from '@tabler/icons-react';
import { useTelegram } from '../hooks/useTelegram';
import { useUserData } from '../hooks/useUserData';
import { apiService } from '../api';
import { getAuthToken } from '../lib/authStorage';
import type { Achievement } from '../models';
import type { StatsResponse } from '../models/biogarden';

const StatBox: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({
	label,
	value,
	color = 'teal',
}) => (
	<Box
		style={{
			background: 'var(--mantine-color-default)',
			border: '1px solid var(--mantine-color-default-border)',
			borderRadius: 10,
			padding: '12px 16px',
			textAlign: 'center',
		}}
	>
		<Text fw={700} size='xl' c={color}>
			{value}
		</Text>
		<Text size='xs' c='dimmed' mt={2}>
			{label}
		</Text>
	</Box>
);

const Profile: React.FC = () => {
	const { user } = useTelegram();
	const { profile, stats, achievements, isLoading, error, refreshData } = useUserData();
	const [bioStats, setBioStats] = useState<StatsResponse | null>(null);

	useEffect(() => {
		const token = getAuthToken();
		if (!user && !token) return;
		const telegramId = Number(user?.id);
		const tgId = telegramId && !isNaN(telegramId) ? telegramId : 0;
		apiService
			.getBiogardenStats(tgId)
			.then(data => setBioStats(data))
			.catch(() => {});
	}, [user?.id, profile?.id]);

	const token = getAuthToken();
	if (!isLoading && !profile && !error && !user && !token) {
		return (
			<Container size='sm' py='xl'>
				<Alert color='yellow' title='Войдите в аккаунт' icon={<IconAlertCircle />}>
					Для просмотра профиля необходимо авторизоваться
				</Alert>
			</Container>
		);
	}

	if (error) {
		return (
			<Container size='sm' py='xl'>
				<Alert color='red' title='Ошибка' icon={<IconAlertCircle />}>
					{error}
				</Alert>
			</Container>
		);
	}

	// Display name: DB username → email prefix → Telegram first name → fallback
	const displayName =
		profile?.username ||
		(profile?.email ? profile.email.split('@')[0] : null) ||
		(user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : null) ||
		'Пользователь';

	const initials = displayName.slice(0, 2).toUpperCase();

	// Sub-info line: email for web users, @username for telegram
	const subInfo = profile?.email
		? profile.email
		: user?.username
		? `@${user.username}`
		: null;

	const completedAchievements = achievements.filter((a: Achievement) => a.achieved).length;
	const totalAchievements = achievements.length;
	const achievementPct =
		totalAchievements > 0 ? Math.round((completedAchievements / totalAchievements) * 100) : 0;

	const completionRate = stats?.completion_rate ?? 0;
	const currentStreak = stats?.current_streak ?? 0;
	const longestStreak = stats?.longest_streak ?? 0;

	const registeredDate = profile?.created_at
		? new Date(profile.created_at).toLocaleDateString('ru-RU', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
		  })
		: '—';

	const bio = bioStats?.overview;
	const hasBioActivity = (bio?.total_plants_started ?? 0) > 0;

	return (
		<Container size='md' py='xl'>
			<Stack gap='lg'>
				{/* Заголовок */}
				<Group justify='space-between'>
					<Title order={1}>Личный кабинет</Title>
					<Button
						leftSection={<IconRefresh size={16} />}
						variant='light'
						onClick={refreshData}
						loading={isLoading}
						size='sm'
					>
						Обновить
					</Button>
				</Group>

				{/* Карточка пользователя */}
				<Card shadow='sm' padding='lg' radius='md' withBorder>
					<Group wrap='nowrap' gap='lg'>
						<Skeleton visible={isLoading} circle height={80}>
							<Avatar
								src={user?.photo_url}
								size={80}
								radius='xl'
								color='teal'
								style={{ fontSize: 28, fontWeight: 700 }}
							>
								{initials}
							</Avatar>
						</Skeleton>

						<Stack gap='xs' style={{ flex: 1, minWidth: 0 }}>
							<Skeleton visible={isLoading} width={isLoading ? 160 : undefined} height={isLoading ? 24 : undefined}>
								<Text fw={700} size='xl' style={{ lineHeight: 1.2 }}>
									{displayName}
								</Text>
							</Skeleton>

							{subInfo && (
								<Text c='dimmed' size='sm' style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
									{subInfo}
								</Text>
							)}

							<Text size='xs' c='dimmed'>
								На платформе с {registeredDate}
							</Text>

							<Group gap='sm' mt={4}>
								<Badge
									variant='light'
									color='yellow'
									leftSection={<IconCoin size={12} />}
								>
									<Skeleton visible={isLoading} width={isLoading ? 50 : undefined}>
										{stats?.total_coins ?? profile?.coins ?? 0} монет
									</Skeleton>
								</Badge>
								<Badge
									variant='light'
									color='teal'
									leftSection={<IconTrophy size={12} />}
								>
									{completedAchievements} достижений
								</Badge>
							</Group>
						</Stack>
					</Group>
				</Card>

				{/* Прогресс + Серия */}
				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					{/* Прогресс обучения */}
					<Card shadow='sm' padding='lg' radius='md' withBorder>
						<Group justify='space-between' mb='md'>
							<Group gap={8}>
								<ThemeIcon color='teal' variant='light' size='md' radius='xl'>
									<IconBook size={16} />
								</ThemeIcon>
								<Text fw={600}>Прогресс по тестам</Text>
							</Group>
							<RingProgress
								size={54}
								thickness={5}
								roundCaps
								sections={[{ value: completionRate, color: 'teal' }]}
								label={
									<Center>
										<Text fw={700} size='xs'>
											{completionRate}%
										</Text>
									</Center>
								}
							/>
						</Group>
						<Progress value={completionRate} color='teal' size='md' radius='xl' mb='sm' />
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Тестов пройдено
							</Text>
							<Text size='sm' fw={600}>
								{stats?.completed_lessons ?? 0} / {stats?.total_lessons ?? 0}
							</Text>
						</Group>
					</Card>

					{/* Серия активности */}
					<Card shadow='sm' padding='lg' radius='md' withBorder>
						<Group gap={8} mb='md'>
							<ThemeIcon color='orange' variant='light' size='md' radius='xl'>
								<IconFlame size={16} />
							</ThemeIcon>
							<Text fw={600}>Серия активности</Text>
						</Group>
						<Group gap='xl'>
							<Stack gap={2} align='center'>
								<Text fw={800} size='2rem' c={currentStreak > 0 ? 'orange' : 'dimmed'} style={{ lineHeight: 1 }}>
									{currentStreak}
								</Text>
								<Text size='xs' c='dimmed'>
									дней сейчас
								</Text>
							</Stack>
							<Divider orientation='vertical' />
							<Stack gap={2} align='center'>
								<Text fw={800} size='2rem' c='yellow.6' style={{ lineHeight: 1 }}>
									{longestStreak}
								</Text>
								<Text size='xs' c='dimmed'>
									рекорд
								</Text>
							</Stack>
						</Group>
						{currentStreak === 0 && (
							<Text size='xs' c='dimmed' mt='sm'>
								Ответь на вопрос в Биосадовнике, чтобы начать серию
							</Text>
						)}
					</Card>
				</SimpleGrid>

				{/* Биосадовник */}
				{hasBioActivity && bio && (
					<Card shadow='sm' padding='lg' radius='md' withBorder>
						<Group gap={8} mb='md'>
							<ThemeIcon color='green' variant='light' size='md' radius='xl'>
								<IconLeaf size={16} />
							</ThemeIcon>
							<Text fw={600}>Биосадовник</Text>
						</Group>
						<SimpleGrid cols={{ base: 2, sm: 4 }} spacing='sm'>
							<StatBox
								label='Растений начато'
								value={bio.total_plants_started}
								color='green'
							/>
							<StatBox
								label='Завершено'
								value={bio.total_plants_completed}
								color='teal'
							/>
							<StatBox
								label='Ответов дано'
								value={bio.total_attempts}
								color='blue'
							/>
							<StatBox
								label='Опыта получено'
								value={`${bio.total_experience_earned} XP`}
								color='violet'
							/>
						</SimpleGrid>
					</Card>
				)}

				{/* Достижения */}
				<Card shadow='sm' padding='lg' radius='md' withBorder>
					<Group justify='space-between' mb='sm'>
						<Group gap={8}>
							<ThemeIcon color='yellow' variant='light' size='md' radius='xl'>
								<IconTrophy size={16} />
							</ThemeIcon>
							<Text fw={600}>Достижения</Text>
						</Group>
						<Badge variant='light' color='yellow'>
							{completedAchievements} / {totalAchievements}
						</Badge>
					</Group>

					<Progress
						value={achievementPct}
						color='yellow'
						size='md'
						radius='xl'
						mb='md'
					/>

					{isLoading ? (
						<Stack gap='xs'>
							{[1, 2, 3].map(i => (
								<Skeleton key={i} height={48} radius='md' />
							))}
						</Stack>
					) : achievements.length === 0 ? (
						<Text size='sm' c='dimmed' ta='center' py='md'>
							Достижения не загружены
						</Text>
					) : (
						<Stack gap={8}>
							{achievements.map((a: Achievement) => (
								<Box
									key={a.code}
									style={{
										display: 'flex',
										gap: 12,
										alignItems: 'flex-start',
										opacity: a.achieved ? 1 : 0.45,
										padding: '8px 10px',
										borderRadius: 8,
										background: a.achieved
											? 'var(--mantine-color-yellow-light)'
											: 'var(--mantine-color-default)',
										border: '1px solid',
										borderColor: a.achieved
											? 'var(--mantine-color-yellow-light-hover)'
											: 'var(--mantine-color-default-border)',
									}}
								>
									<ThemeIcon
										color={a.achieved ? 'yellow' : 'gray'}
										variant={a.achieved ? 'filled' : 'light'}
										size='sm'
										radius='xl'
										style={{ flexShrink: 0, marginTop: 2 }}
									>
										{a.achieved ? <IconCheck size={12} /> : <IconLock size={12} />}
									</ThemeIcon>
									<Box style={{ flex: 1, minWidth: 0 }}>
										<Text size='sm' fw={a.achieved ? 600 : 400}>
											{a.title}
										</Text>
										{a.description && (
											<Text size='xs' c='dimmed' style={{ lineHeight: 1.4 }}>
												{a.description}
											</Text>
										)}
									</Box>
									{a.achieved && a.awarded_at && (
										<Text size='xs' c='dimmed' style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
											{new Date(a.awarded_at).toLocaleDateString('ru-RU', {
												day: 'numeric',
												month: 'short',
											})}
										</Text>
									)}
									{a.achieved && (
										<ThemeIcon color='yellow' variant='transparent' size='sm'>
											<IconStar size={14} />
										</ThemeIcon>
									)}
								</Box>
							))}
						</Stack>
					)}
				</Card>
			</Stack>
		</Container>
	);
};

export default Profile;
