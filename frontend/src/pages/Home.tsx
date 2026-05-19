import { Container, Stack } from '@mantine/core';
import { MaterialsSection } from '../components/home/MaterialsSection';
import { FeaturedQuiz } from '../components/home/FeaturedQuiz';
import { TasksSection } from '../components/home/TasksSection';
import { useHomeData } from '../hooks/home/useHomeData';

export default function Home() {
	const {
		isLoading,
		error,
		sections,
		featuredQuiz,
		filteredTasks,
		collections,
		taskFilter,
		setTaskFilter,
	} = useHomeData();

	if (error) return <div>{error}</div>;
	if (isLoading) return <div>Загрузка...</div>;

	return (
		<Container size='lg' py='xl'>
			<Stack gap='xl'>
				<MaterialsSection sections={sections} />
				<FeaturedQuiz quiz={featuredQuiz} />
				<TasksSection
					tasks={filteredTasks}
					collections={collections.map(c => ({
						id: c.id,
						title: c.title,
						description: c.description ?? '',
						download_url: c.download_url,
					}))}
					taskFilter={taskFilter}
					setTaskFilter={setTaskFilter}
				/>
			</Stack>
		</Container>
	);
}
