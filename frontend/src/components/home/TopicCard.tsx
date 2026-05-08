import {
	Card,
	Stack,
	Group,
	Text,
	Badge,
	Button,
	Tooltip,
} from '@mantine/core';
import {
	IconCoin,
	IconDownload,
	IconLock,
	IconLockOpen,
} from '@tabler/icons-react';
import { useFileDownload } from '../../hooks/home/useFileDownload';

import { useTelegram } from '../../hooks/useTelegram';
import type { Topic } from '../../models';
import { useState } from 'react';
import { useTopicPurchase } from '../../hooks/home/useTopicPurchase';

interface TopicCardProps {
	topic: Topic;
	onPurchaseSuccess?: (newBalance: number) => void;
	userBalance?: number | null;
}

export function TopicCard({
	topic,
	onPurchaseSuccess,
	userBalance,
}: TopicCardProps) {
	const { downloadFile, downloading } = useFileDownload();
	const { purchaseTopic, purchasingTopicId } = useTopicPurchase();
	const { user } = useTelegram();

	const telegramId = user?.id;

	// Локальное состояние для мгновенного обновления UI
	const [isUnlocked, setIsUnlocked] = useState(topic.is_purchased);

	// Проверяем, хватает ли денег на покупку
	const hasEnoughMoney = userBalance && userBalance >= topic.price_repcoins;

	// Обработчик покупки темы
	const handlePurchase = async () => {
		if (isUnlocked) {
			// Тема уже открыта - ничего не делаем
			return;
		}

		// Проверяем баланс (если он загружен)
		if (userBalance !== null && !hasEnoughMoney) {
			// Показываем сообщение о недостатке средств
			return;
		}

		// Покупаем тему
		const success = await purchaseTopic(telegramId, topic, onPurchaseSuccess);

		// Если покупка успешна, сразу обновляем UI
		if (success) {
			setIsUnlocked(true);
		}
	};

	// Определяем текст и иконку для кнопки
	const getButtonText = () => {
		if (isUnlocked) {
			return 'Открыть';
		}
		return `Купить и открыть (${topic.price_repcoins} реп.)`;
	};

	const getButtonIcon = () => {
		if (isUnlocked) {
			return <IconLockOpen size={16} />;
		}
		return <IconLock size={16} />;
	};

	// Определяем, должна ли кнопка быть disabled
	const isButtonDisabled =
		!isUnlocked && userBalance !== null && !hasEnoughMoney;

	return (
		<Card withBorder radius='md' padding='lg' shadow='sm'>
			<Stack gap='xs'>
				<Group justify='space-between' align='flex-start'>
					<div>
						<Text fw={600}>{topic.title}</Text>
						<Text c='dimmed' size='sm'>
							{topic.description}
						</Text>
					</div>
					<Badge
						color={isUnlocked ? 'teal' : 'gray'}
						leftSection={<IconCoin size={14} />}
					>
						{topic.price_repcoins} реп.
					</Badge>
				</Group>

				<Tooltip
					label={
						isButtonDisabled
							? `Недостаточно средств. Нужно еще ${
									topic.price_repcoins - (userBalance || 0)
							  } репкоинов`
							: ''
					}
					disabled={!isButtonDisabled}
					position='top'
				>
					<Button
						variant={isUnlocked ? 'light' : 'filled'}
						color={isUnlocked ? 'teal' : 'blue'}
						onClick={handlePurchase}
						loading={purchasingTopicId === topic.id}
						leftSection={getButtonIcon()}
						disabled={isButtonDisabled}
						fullWidth
					>
						{getButtonText()}
					</Button>
				</Tooltip>

				{isUnlocked && topic.files && topic.files.length > 0 && (
					<Stack gap='xs'>
						<Text size='sm' fw={500} c='dimmed'>
							Доступные файлы:
						</Text>
						{topic.files.map(file => (
							<Group key={file.id} justify='space-between' align='flex-start'>
								<div>
									<Text size='sm' fw={500}>
										{file.name}
									</Text>
									<Group gap='xs'>
										<Badge variant='light' color='gray'>
											{file.file_type.toUpperCase()}
										</Badge>
										{file.file_size && (
											<Text size='xs' c='dimmed'>
												{file.file_size} МБ
											</Text>
										)}
									</Group>
								</div>
								<Button
									size='xs'
									variant='subtle'
									leftSection={<IconDownload size={14} />}
									loading={downloading === file.id.toString()}
									onClick={() => downloadFile(file)}
								>
									Скачать
								</Button>
							</Group>
						))}
					</Stack>
				)}

				{!isUnlocked && (
					<Text size='xs' c='dimmed' ta='center'>
						Для доступа к файлам купите тему
					</Text>
				)}
			</Stack>
		</Card>
	);
}
