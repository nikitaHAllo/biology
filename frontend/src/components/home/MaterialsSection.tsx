import {
	Accordion,
	Group,
	Text,
	Title,
	ThemeIcon,
	SimpleGrid,
} from '@mantine/core';
import { IconFolder } from '@tabler/icons-react';
import { TopicCard } from './TopicCard';
import type { SectionWithTopics } from '../../models';

interface MaterialsSectionProps {
	sections: SectionWithTopics[];
}

export function MaterialsSection({ sections }: MaterialsSectionProps) {
	return (
		<section>
			<Group justify='space-between' mb='md'>
				<div>
					<Title order={1}>Каталог материалов</Title>
					<Text c='dimmed'>Разделы → темы → файлы</Text>
				</div>
				<ThemeIcon size='xl' radius='md' color='teal'>
					<IconFolder size={24} />
				</ThemeIcon>
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
									<TopicCard key={topic.id} topic={topic} />
								))}
							</SimpleGrid>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</section>
	);
}
