import {
	MaterialSection,
	MaterialTopic,
	MaterialFile,
	Quiz,
	QuizQuestion,
	QuizOption,
	DownloadableTask,
	TaskCollection,
	TaskCollectionItem,
	sequelize,
} from '../models';

type MaterialSeed = {
	title: string;
	slug: string;
	description?: string;
	icon?: string;
	order_index: number;
	topics: Array<{
		title: string;
		slug: string;
		description: string;
		price_repcoins: number;
		order_index: number;
		is_default_unlocked?: boolean;
		files: Array<{
			name: string;
			file_url: string;
			file_type: 'word' | 'pdf' | 'zip' | 'other';
			file_size?: number;
		}>;
	}>;
};

type QuizSeed = {
	id: number;
	title: string;
	description: string;
	total_points: number;
	estimated_minutes: number;
	questions: Array<{
		question_text: string;
		question_type: 'single_choice' | 'multiple_choice' | 'true_false';
		points: number;
		order_index: number;
		timer_seconds?: number;
		explanation: string;
		options: Array<{
			option_text: string;
			is_correct: boolean;
			order_index: number;
		}>;
	}>;
};

type DownloadTaskSeed = {
	title: string;
	source: 'ege' | 'fipi' | 'other';
	description: string;
	file_url: string;
	file_type: 'word' | 'pdf' | 'zip';
	file_size: number;
	year: number;
	subject: string;
};

type TaskCollectionSeed = {
	title: string;
	source: 'ege' | 'fipi' | 'other';
	description: string;
	taskTitles: string[];
};

const materialsSeed: MaterialSeed[] = [
	{
		title: 'Цитология',
		slug: 'cytology',
		description: 'Строение клетки и функции органоидов.',
		icon: '🧫',
		order_index: 1,
		topics: [
			{
				title: 'Органоиды клетки',
				slug: 'cell-organelles',
				description: 'Сравнение строения митохондрий, рибосом и комплекса Гольджи.',
				price_repcoins: 3,
				order_index: 1,
				is_default_unlocked: true,
				files: [
					{
						name: 'Конспект по органоидам',
						file_url: '/downloads/organelles.pdf',
						file_type: 'pdf',
						file_size: 1.2,
					},
					{
						name: 'Таблица “Органоид — функция”',
						file_url: '/downloads/organelles.docx',
						file_type: 'word',
						file_size: 0.6,
					},
				],
			},
			{
				title: 'Деление клетки',
				slug: 'cell-division',
				description: 'Мейоз, митоз и контрольные точки цикла.',
				price_repcoins: 4,
				order_index: 2,
				files: [
					{
						name: 'Чек-лист стадий митоза',
						file_url: '/downloads/mitosis.pdf',
						file_type: 'pdf',
						file_size: 0.8,
					},
				],
			},
		],
	},
	{
		title: 'Анатомия человека',
		slug: 'anatomy',
		description: 'Системы органов, физиология и нормы.',
		icon: '🫀',
		order_index: 2,
		topics: [
			{
				title: 'Кровеносная система',
				slug: 'circulatory-system',
				description: 'Гемодинамика, состав крови и регуляция сердечного ритма.',
				price_repcoins: 5,
				order_index: 1,
				files: [
					{
						name: 'Схема кровообращения',
						file_url: '/downloads/blood-system.pdf',
						file_type: 'pdf',
						file_size: 1.5,
					},
					{
						name: 'Практикум по измерению пульса',
						file_url: '/downloads/pulse.docx',
						file_type: 'word',
						file_size: 0.9,
					},
				],
			},
			{
				title: 'Нервная система',
				slug: 'nervous-system',
				description: 'Рефлексы, строение нейрона и стресс-реакции.',
				price_repcoins: 6,
				order_index: 2,
				files: [
					{
						name: 'Презентация по рефлексам',
						file_url: '/downloads/reflexes.pdf',
						file_type: 'pdf',
						file_size: 2.1,
					},
					{
						name: 'Сводка нервных центров',
						file_url: '/downloads/nerve-centers.docx',
						file_type: 'word',
						file_size: 1.0,
					},
				],
			},
		],
	},
	{
		title: 'Экология',
		slug: 'ecology',
		description: 'Экосистемы, цепи питания и устойчивое развитие.',
		icon: '🌿',
		order_index: 3,
		topics: [
			{
				title: 'Биомы и климат',
				slug: 'biomes',
				description: 'Сравнение пустынь, тайги и тропического леса.',
				price_repcoins: 2,
				order_index: 1,
				files: [
					{
						name: 'Карточки по биомам',
						file_url: '/downloads/biomes.pdf',
						file_type: 'pdf',
						file_size: 0.7,
					},
				],
			},
			{
				title: 'Человек и экосистемы',
				slug: 'human-impact',
				description: 'Экологический след и способы его сокращения.',
				price_repcoins: 3,
				order_index: 2,
				files: [
					{
						name: 'Методичка “Городская экология”',
						file_url: '/downloads/urban-ecology.pdf',
						file_type: 'pdf',
						file_size: 1.1,
					},
					{
						name: 'Практические задания',
						file_url: '/downloads/eco-practice.zip',
						file_type: 'zip',
						file_size: 4.2,
					},
				],
			},
		],
	},
];

const quizzesSeed: QuizSeed[] = [
	{
		id: 1,
		title: 'Цитология. Базовый уровень',
		description: 'Проверь себя по строению клетки и клеточному циклу.',
		total_points: 30,
		estimated_minutes: 5,
		questions: [
			{
				question_text: 'Какая органелла синтезирует АТФ в клетке?',
				question_type: 'single_choice',
				points: 10,
				order_index: 1,
				timer_seconds: 30,
				explanation:
					'Основная функция митохондрий — синтез АТФ в ходе окислительного фосфорилирования.',
				options: [
					{ option_text: 'Митохондрия', is_correct: true, order_index: 1 },
					{ option_text: 'Лизосома', is_correct: false, order_index: 2 },
					{ option_text: 'Аппарат Гольджи', is_correct: false, order_index: 3 },
					{ option_text: 'Центриоль', is_correct: false, order_index: 4 },
				],
			},
			{
				question_text: 'Выберите этапы, характерные для митоза.',
				question_type: 'multiple_choice',
				points: 10,
				order_index: 2,
				timer_seconds: 45,
				explanation:
					'Классические стадии митоза: профаза, метафаза, анафаза и телофаза.',
				options: [
					{ option_text: 'Профаза', is_correct: true, order_index: 1 },
					{ option_text: 'Мейофаза', is_correct: false, order_index: 2 },
					{ option_text: 'Метафаза', is_correct: true, order_index: 3 },
					{ option_text: 'Анафаза', is_correct: true, order_index: 4 },
				],
			},
			{
				question_text:
					'Верно ли, что интерфаза — самая продолжительная часть клеточного цикла?',
				question_type: 'true_false',
				points: 10,
				order_index: 3,
				timer_seconds: 20,
				explanation:
					'В интерфазу клетка растет, удваивает ДНК и готовится к делению, поэтому эта стадия длится дольше остальных.',
				options: [
					{ option_text: 'Верно', is_correct: true, order_index: 1 },
					{ option_text: 'Неверно', is_correct: false, order_index: 2 },
				],
			},
		],
	},
	{
		id: 2,
		title: 'Цитология. Базовый уровень',
		description: 'Проверь себя по строению клетки и клеточному циклу.',
		total_points: 30,
		estimated_minutes: 5,
		questions: [
			{
				question_text: 'Какая органелла синтезирует АТФ в клетке?',
				question_type: 'single_choice',
				points: 10,
				order_index: 1,
				timer_seconds: 30,
				explanation:
					'Основная функция митохондрий — синтез АТФ в ходе окислительного фосфорилирования.',
				options: [
					{ option_text: 'Митохондрия', is_correct: true, order_index: 1 },
					{ option_text: 'Лизосома', is_correct: false, order_index: 2 },
					{ option_text: 'Аппарат Гольджи', is_correct: false, order_index: 3 },
					{ option_text: 'Центриоль', is_correct: false, order_index: 4 },
				],
			},
			{
				question_text: 'Выберите этапы, характерные для митоза.',
				question_type: 'multiple_choice',
				points: 10,
				order_index: 2,
				timer_seconds: 45,
				explanation:
					'Классические стадии митоза: профаза, метафаза, анафаза и телофаза.',
				options: [
					{ option_text: 'Профаза', is_correct: true, order_index: 1 },
					{ option_text: 'Мейофаза', is_correct: false, order_index: 2 },
					{ option_text: 'Метафаза', is_correct: true, order_index: 3 },
					{ option_text: 'Анафаза', is_correct: true, order_index: 4 },
				],
			},
			{
				question_text:
					'Верно ли, что интерфаза — самая продолжительная часть клеточного цикла?',
				question_type: 'true_false',
				points: 10,
				order_index: 3,
				timer_seconds: 20,
				explanation:
					'В интерфазу клетка растет, удваивает ДНК и готовится к делению, поэтому эта стадия длится дольше остальных.',
				options: [
					{ option_text: 'Верно', is_correct: true, order_index: 1 },
					{ option_text: 'Неверно', is_correct: false, order_index: 2 },
				],
			},
		],
	},
];

const downloadableTasksSeed: DownloadTaskSeed[] = [
	{
		title: 'ЕГЭ 2024. Демоверсия',
		source: 'ege',
		description: 'Полный вариант демоверсии ЕГЭ по биологии за 2024 год.',
		file_url: '/downloads/ege-demo-2024.pdf',
		file_type: 'pdf',
		file_size: 2.4,
		year: 2024,
		subject: 'Биология',
	},
	{
		title: 'ФИПИ. Задания по цитологии',
		source: 'fipi',
		description: 'Подборка задач базового уровня из банка ФИПИ.',
		file_url: '/downloads/fipi-cytology.docx',
		file_type: 'word',
		file_size: 1.1,
		year: 2023,
		subject: 'Цитология',
	},
	{
		title: 'Практикум по анатомии',
		source: 'other',
		description: 'Раздаточные материалы по анатомии человека.',
		file_url: '/downloads/anatomy-practice.zip',
		file_type: 'zip',
		file_size: 5.7,
		year: 2022,
		subject: 'Анатомия',
	},
	{
		title: 'ЕГЭ. Сложные задания “Человек и его здоровье”',
		source: 'ege',
		description: 'Подборка заданий части 2 с подробными ответами.',
		file_url: '/downloads/ege-health.pdf',
		file_type: 'pdf',
		file_size: 3.0,
		year: 2024,
		subject: 'Анатомия',
	},
];

const taskCollectionsSeed: TaskCollectionSeed[] = [
	{
		title: 'ЕГЭ: тренировки на месяц',
		source: 'ege',
		description: '30 заданий на каждую неделю + ответы.',
		taskTitles: [
			'ЕГЭ 2024. Демоверсия',
			'ЕГЭ. Сложные задания “Человек и его здоровье”',
		],
	},
	{
		title: 'FIPI Starter Pack',
		source: 'fipi',
		description: 'Краткие задания для повторения перед мини-аппом.',
		taskTitles: ['ФИПИ. Задания по цитологии'],
	},
];

async function seedMaterials() {
	const sectionCount = await MaterialSection.count();
	if (sectionCount > 0) return;

	await sequelize.transaction(async transaction => {
		for (const sectionData of materialsSeed) {
			const section = await MaterialSection.create(
				{
					title: sectionData.title,
					slug: sectionData.slug,
					description: sectionData.description ?? null,
					icon: sectionData.icon ?? null,
					order_index: sectionData.order_index,
				},
				{ transaction }
			);
			const sectionId = Number(section.get('id'));
			if (!sectionId) {
				throw new Error('Failed to persist material section');
			}

			for (const topicData of sectionData.topics) {
				const topic = await MaterialTopic.create(
					{
						section_id: sectionId,
						title: topicData.title,
						slug: topicData.slug,
						description: topicData.description ?? null,
						price_repcoins: topicData.price_repcoins,
						order_index: topicData.order_index,
						is_default_unlocked: Boolean(topicData.is_default_unlocked),
					},
					{ transaction }
				);
				const topicId = Number(topic.get('id'));
				if (!topicId) {
					throw new Error('Failed to persist material topic');
				}

				for (const file of topicData.files) {
					await MaterialFile.create(
						{
							topic_id: topicId,
							name: file.name,
							file_url: file.file_url,
							file_type: file.file_type,
							file_size: file.file_size ?? null,
						},
						{ transaction }
					);
				}
			}
		}
	});
}

async function seedQuizzes() {
	const quizCount = await Quiz.count();
	if (quizCount > 0) return;

	await sequelize.transaction(async transaction => {
		for (const quizData of quizzesSeed) {
			const quiz = await Quiz.create(
				{
					id: quizData.id,
					title: quizData.title,
					description: quizData.description,
					total_points: quizData.total_points,
					total_questions: quizData.questions.length,
					estimated_minutes: quizData.estimated_minutes,
				},
				{ transaction }
			);
			const quizId = Number(quiz.get('id'));
			if (!quizId) {
				throw new Error('Failed to persist quiz');
			}

			for (const questionData of quizData.questions) {
				const question = await QuizQuestion.create(
					{
						quiz_id: quizId,
						question_text: questionData.question_text,
						question_type: questionData.question_type,
						order_index: questionData.order_index,
						points: questionData.points,
						timer_seconds: questionData.timer_seconds ?? null,
						explanation: questionData.explanation,
					},
					{ transaction }
				);

				const questionId = Number(question.get('id'));
				if (!questionId) {
					throw new Error('Failed to persist quiz question');
				}

				for (const option of questionData.options) {
					await QuizOption.create(
						{
							question_id: questionId,
							option_text: option.option_text,
							is_correct: option.is_correct,
							order_index: option.order_index,
						},
						{ transaction }
					);
				}
			}
		}
	});
}

async function seedDownloadableTasks() {
	const existingCount = await DownloadableTask.count();
	if (existingCount > 0) return;

	await sequelize.transaction(async transaction => {
		const createdTasks = new Map<string, DownloadableTask>();

		for (const taskData of downloadableTasksSeed) {
			const task = await DownloadableTask.create(
				{
					title: taskData.title,
					source: taskData.source,
					description: taskData.description ?? null,
					file_url: taskData.file_url,
					file_type: taskData.file_type,
					file_size: taskData.file_size ?? null,
					year: taskData.year ?? null,
					subject: taskData.subject ?? null,
				},
				{ transaction }
			);
			const taskId = Number(task.get('id'));
			if (!taskId) {
				throw new Error('Failed to persist downloadable task');
			}

			createdTasks.set(taskData.title, task);
		}

		for (const collectionData of taskCollectionsSeed) {
			const tasksForCollection = collectionData.taskTitles
				.map(title => createdTasks.get(title))
				.filter((task): task is DownloadableTask => Boolean(task));

			if (tasksForCollection.length === 0) {
				continue;
			}

			const totalSize = tasksForCollection.reduce((sum, task) => {
				const size = typeof task.file_size === 'number' ? task.file_size : Number(task.file_size || 0);
				return sum + (Number.isNaN(size) ? 0 : size);
			}, 0);

			const collection = await TaskCollection.create(
				{
					title: collectionData.title,
					source: collectionData.source,
					description: collectionData.description,
					total_size: totalSize,
				},
				{ transaction }
			);
			const collectionId = Number(collection.get('id'));
			if (!collectionId) {
				throw new Error('Failed to persist task collection');
			}

			await Promise.all(
				tasksForCollection.map((task, index) => {
					const taskId = Number(task.get('id'));
					if (!taskId) {
						throw new Error('Failed to resolve downloadable task');
					}
					return TaskCollectionItem.create(
						{
							collection_id: collectionId,
							task_id: taskId,
							order_index: index + 1,
						},
						{ transaction }
					);
				})
			);
		}
	});
}

export async function seedCatalogData() {
	await seedMaterials();
	await seedQuizzes();
	await seedDownloadableTasks();
}


