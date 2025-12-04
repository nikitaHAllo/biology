import { Card, Stack, Group, Text, Badge, Button } from '@mantine/core';
import { IconCoin, IconDownload } from '@tabler/icons-react';

interface TopicFile {
	id: number | string;
	name: string;
	file_type: string;
	file_size?: number;
	file_url: string;
}

interface Topic {
	id: number | string;
	title: string;
	description: string;
	price: number;
	files: TopicFile[];
}

interface TopicCardProps {
	topic: Topic;
}
function useHomeLogic(topic: Topic) {
	return {
		isUnlocked: true,
		numericTopicId: topic.id,
		topicFiles: topic.files,
		topicTitle: topic.title,
		topicDescription: topic.description,
		topicPrice: topic.price,
		purchaseLoading: null as number | null,
		handlePurchase: (t: Topic) => console.log('Purchase', t),
	};
}

export function TopicCard({ topic }: TopicCardProps) {
	const {
		isUnlocked,
		numericTopicId,
		topicFiles,
		topicTitle,
		topicDescription,
		topicPrice,
		purchaseLoading,
		handlePurchase,
	} = useHomeLogic(topic);

	return (
		<Card withBorder radius='md' padding='lg' shadow='sm'>
			<Stack gap='xs'>
				<Group justify='space-between' align='flex-start'>
					<div>
						<Text fw={600}>{topicTitle}</Text>
						<Text c='dimmed' size='sm'>
							{topicDescription}
						</Text>
					</div>
					<Badge
						color={isUnlocked ? 'teal' : 'gray'}
						leftSection={<IconCoin size={14} />}
					>
						{topicPrice} реп.
					</Badge>
				</Group>

				<Button
					variant={isUnlocked ? 'light' : 'filled'}
					color={isUnlocked ? 'teal' : 'blue'}
					onClick={() => handlePurchase(topic)}
					loading={purchaseLoading === numericTopicId}
				>
					{isUnlocked ? 'Открыть' : 'Купить и открыть'}
				</Button>

				{isUnlocked && topicFiles.length > 0 && (
					<Stack gap='xs'>
						{topicFiles.map(file => (
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
									component='a'
									href={file.file_url}
									target='_blank'
								>
									Скачать
								</Button>
							</Group>
						))}
					</Stack>
				)}
			</Stack>
		</Card>
	);
}
