import {
	Accordion,
	Group,
	Text,
	Title,
	ThemeIcon,
	SimpleGrid,
	Badge,
} from '@mantine/core';
import { IconFolder, IconCoin } from '@tabler/icons-react';
import { TopicCard } from './TopicCard';
import type { SectionWithTopics } from '../../models';
import { useTelegram } from '../../hooks/useTelegram';
import { apiService } from '../../api';
import { useState, useEffect, useCallback } from 'react';
import { showNotification } from '@mantine/notifications';

interface MaterialsSectionProps {
	sections: SectionWithTopics[];
}

export function MaterialsSection({ sections }: MaterialsSectionProps) {
	const { user } = useTelegram();
	const [userBalance, setUserBalance] = useState<number | null>(null);
	const [isLoadingBalance, setIsLoadingBalance] = useState(false);

	// Загружаем баланс пользователя
	const loadUserBalance = useCallback(async () => {
		if (!user?.id) return;

		try {
			setIsLoadingBalance(true);
			const balance = await apiService.getUserBalance(user.id);
			setUserBalance(balance);
		} catch (error) {
			console.error('Error loading balance:', error);
		} finally {
			setIsLoadingBalance(false);
		}
	}, [user]);

	// Загружаем баланс при загрузке компонента
	useEffect(() => {
		loadUserBalance();
	}, [loadUserBalance]);

	// Обработчик успешной покупки
	const handleBalanceChange = useCallback((newBalance: number) => {
		setUserBalance(newBalance);

		// Показываем уведомление
		showNotification({
			title: 'Баланс обновлен',
			message: `Ваш баланс: ${newBalance} репкоинов`,
			color: 'teal',
		});
	}, []);

	return (
		<section>
			<Group justify='space-between' mb='md'>
				<div>
					<Title order={1}>Каталог материалов</Title>
					<Text c='dimmed'>Разделы → темы → файлы</Text>
				</div>
				<Group gap='sm'>
					{isLoadingBalance ? (
						<Badge variant='light' color='gray' size='lg'>
							Загрузка...
						</Badge>
					) : userBalance !== null ? (
						<Badge
							variant='filled'
							color='teal'
							size='lg'
							leftSection={<IconCoin size={16} />}
						>
							{userBalance} реп.
						</Badge>
					) : null}
					<ThemeIcon size='xl' radius='md' color='teal'>
						<IconFolder size={24} />
					</ThemeIcon>
				</Group>
			</Group>

			<Accordion
				multiple
				defaultValue={sections[0]?.slug ? [sections[0].slug] : []}
			>
				{sections.map(section => (
					<Accordion.Item key={section.id} value={section.slug}>
						<Accordion.Control>
							<Group gap='sm'>
								<ThemeIcon variant='light' color='teal'>
									{section.icon || '📘'}
								</ThemeIcon>
								<div>
									<Text fw={600}>{section.title}</Text>
									<Text size='sm' c='dimmed'>
										{section.description}
									</Text>
								</div>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='lg'>
								{section.topics.map(topic => (
									<TopicCard
										key={topic.id}
										topic={topic}
										onPurchaseSuccess={handleBalanceChange}
										userBalance={userBalance}
									/>
								))}
							</SimpleGrid>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</section>
	);
}
