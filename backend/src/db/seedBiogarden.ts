// seed-biogarden.ts
import {
	BioGardenPlant,
	BioGardenQuestion,
	BioGardenAnswerOption,
	sequelize,
} from '../models';
import { Op } from 'sequelize';

interface PlantSeed {
	name: string;
	scientific_name: string;
	description: string;
	image_url?: string;
	growth_stages: number;
	required_experience: number;
	biology_topics: string[];
	difficulty_level: number;
}

interface QuestionSeed {
	plant_name: string;
	question_text: string;
	explanation: string;
	points: number;
	difficulty_level: number;
	biology_topic: string;
	ege_code: string;
	options: Array<{
		option_text: string;
		is_correct: boolean;
		order_index: number;
	}>;
}

const plantsSeed: PlantSeed[] = [
	// 🌱 Горох — Генетика (3.5–3.8), сложность 1
	{
		name: 'Горох посевной',
		scientific_name: 'Pisum sativum',
		description:
			'Классический объект для изучения генетики. Мендель использовал горох для своих экспериментов.',
		image_url:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Peas_in_pods_-_Studio.jpg/320px-Peas_in_pods_-_Studio.jpg',
		growth_stages: 5,
		required_experience: 0,
		biology_topics: ['Генетика (3.5–3.8)'],
		difficulty_level: 1,
	},
	// 🟢 Хламидомонада — Цитология (2.1–2.8), сложность 2
	{
		name: 'Хламидомонада',
		scientific_name: 'Chlamydomonas',
		description:
			'Одноклеточная зелёная водоросль, объект изучения клеточной биологии и фотосинтеза.',
		image_url:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Chlamydomonas_%28Chlorophyta%29_%2834446608450%29.jpg/320px-Chlamydomonas_%28Chlorophyta%29_%2834446608450%29.jpg',
		growth_stages: 5,
		required_experience: 50,
		biology_topics: ['Цитология (2.1–2.8)'],
		difficulty_level: 2,
	},
	// 🥔 Картофель — Размножение (3.1–3.4), сложность 3
	{
		name: 'Картофель',
		scientific_name: 'Solanum tuberosum',
		description:
			'Паслёновое растение, классический пример вегетативного размножения клубнями.',
		image_url:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/320px-Patates.jpg',
		growth_stages: 5,
		required_experience: 100,
		biology_topics: ['Размножение (3.1–3.4)'],
		difficulty_level: 3,
	},
	// 🦠 Эвглена — Многообразие (4.1–4.2), сложность 4
	{
		name: 'Эвглена зелёная',
		scientific_name: 'Euglena viridis',
		description:
			'Одноклеточный организм со смешанными признаками растений и животных, пример многообразия живых организмов.',
		image_url:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Euglena_sp.jpg/320px-Euglena_sp.jpg',
		growth_stages: 5,
		required_experience: 150,
		biology_topics: ['Многообразие (4.1–4.2)'],
		difficulty_level: 4,
	},
	// 🌿 Папоротник — Систематика растений (4.3–4.6), сложность 5
	{
		name: 'Папоротник',
		scientific_name: 'Polypodiopsida',
		description:
			'Высшее споровое растение, важный объект для изучения систематики и жизненных циклов растений.',
		image_url:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Fern.jpg/320px-Fern.jpg',
		growth_stages: 5,
		required_experience: 200,
		biology_topics: ['Систематика растений (4.3–4.6)'],
		difficulty_level: 5,
	},
	// 🌽 Кукуруза — Селекция (3.9–3.11), сложность 6
	{
		name: 'Кукуруза',
		scientific_name: 'Zea mays',
		description:
			'Важная сельскохозяйственная культура и классический объект исследований по селекции и генетике.',
		image_url:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Zea_mays.jpg/320px-Zea_mays.jpg',
		growth_stages: 5,
		required_experience: 250,
		biology_topics: ['Селекция (3.9–3.11)'],
		difficulty_level: 6,
	},
	// 🌲 Сосна — Эволюция (6.1–6.5), сложность 7
	{
		name: 'Сосна обыкновенная',
		scientific_name: 'Pinus sylvestris',
		description:
			'Характерный представитель голосеменных, пример эволюции семенных растений и приспособлений к наземной жизни.',
		image_url:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Scots_pine.jpg/320px-Scots_pine.jpg',
		growth_stages: 5,
		required_experience: 300,
		biology_topics: ['Эволюция (6.1–6.5)'],
		difficulty_level: 7,
	},
	// 🌾 Сфагнум — Экология (7.1–7.5), сложность 8
	{
		name: 'Сфагнум',
		scientific_name: 'Sphagnum',
		description:
			'Торфяной мох, ключевой вид болотных экосистем, важен для понимания экологии и круговорота веществ.',
		image_url:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Sphagnum_fimbriatum.jpeg/320px-Sphagnum_fimbriatum.jpeg',
		growth_stages: 5,
		required_experience: 350,
		biology_topics: ['Экология (7.1–7.5)'],
		difficulty_level: 8,
	},
];

const questionsSeed: QuestionSeed[] = [
	// Вопросы для Гороха (уровень сложности 1)
	{
		plant_name: 'Горох посевной',
		question_text:
			'Какой учёный проводил классические эксперименты по генетике на горохе?',
		explanation:
			'Грегор Мендель проводил опыты с горохом в 1860-х годах, что привело к открытию законов наследственности.',
		points: 10,
		difficulty_level: 1,
		biology_topic: 'Генетика',
		ege_code: '3.1',
		options: [
			{ option_text: 'Грегор Мендель', is_correct: true, order_index: 1 },
			{ option_text: 'Чарльз Дарвин', is_correct: false, order_index: 2 },
			{ option_text: 'Луи Пастер', is_correct: false, order_index: 3 },
			{ option_text: 'Иван Павлов', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Горох посевной',
		question_text: 'К какому семейству относится горох?',
		explanation:
			'Горох относится к семейству Бобовые (Fabaceae), которые имеют характерные плоды-бобы.',
		points: 10,
		difficulty_level: 1,
		biology_topic: 'Ботаника',
		ege_code: '2.5',
		options: [
			{ option_text: 'Бобовые', is_correct: true, order_index: 1 },
			{ option_text: 'Паслёновые', is_correct: false, order_index: 2 },
			{ option_text: 'Злаковые', is_correct: false, order_index: 3 },
			{ option_text: 'Крестоцветные', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Горох посевной',
		question_text: 'Какой тип плода характерен для гороха?',
		explanation:
			'Горох имеет плод-боб, который является сухим многосемянным плодом, раскрывающимся по двум швам.',
		points: 15,
		difficulty_level: 1,
		biology_topic: 'Ботаника',
		ege_code: '2.5',
		options: [
			{ option_text: 'Боб', is_correct: true, order_index: 1 },
			{ option_text: 'Коробочка', is_correct: false, order_index: 2 },
			{ option_text: 'Ягода', is_correct: false, order_index: 3 },
			{ option_text: 'Зерновка', is_correct: false, order_index: 4 },
		],
	},
	// Вопросы для Кукурузы (уровень сложности 2)
	{
		plant_name: 'Кукуруза',
		question_text:
			'К какому классу покрытосеменных растений относится кукуруза?',
		explanation:
			'Кукуруза - однодольное растение, так как имеет одну семядолю, мочковатую корневую систему и параллельное жилкование листьев.',
		points: 15,
		difficulty_level: 2,
		biology_topic: 'Ботаника',
		ege_code: '2.1',
		options: [
			{ option_text: 'Однодольные', is_correct: true, order_index: 1 },
			{ option_text: 'Двудольные', is_correct: false, order_index: 2 },
			{ option_text: 'Голосеменные', is_correct: false, order_index: 3 },
			{ option_text: 'Папоротниковидные', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Кукуруза',
		question_text: 'Какое соцветие характерно для кукурузы?',
		explanation:
			'Кукуруза имеет раздельнополые соцветия: мужское - метёлка на верхушке, женское - початок в пазухах листьев.',
		points: 20,
		difficulty_level: 2,
		biology_topic: 'Ботаника',
		ege_code: '2.3',
		options: [
			{
				option_text: 'Мужское - метёлка, женское - початок',
				is_correct: true,
				order_index: 1,
			},
			{
				option_text: 'Мужское - початок, женское - метёлка',
				is_correct: false,
				order_index: 2,
			},
			{ option_text: 'Колос', is_correct: false, order_index: 3 },
			{ option_text: 'Зонтик', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Кукуруза',
		question_text: 'Какой тип фотосинтеза характерен для кукурузы?',
		explanation:
			'Кукуруза относится к растениям С4-типа фотосинтеза, что позволяет ей эффективно фиксировать CO₂ при высоких температурах.',
		points: 25,
		difficulty_level: 2,
		biology_topic: 'Фотосинтез',
		ege_code: '2.6',
		options: [
			{ option_text: 'С4-тип', is_correct: true, order_index: 1 },
			{ option_text: 'С3-тип', is_correct: false, order_index: 2 },
			{ option_text: 'CAM-тип', is_correct: false, order_index: 3 },
			{ option_text: 'С2-тип', is_correct: false, order_index: 4 },
		],
	},
	// Вопросы для Хламидомонады (уровень сложности 3)
	{
		plant_name: 'Хламидомонада',
		question_text: 'Какие органеллы движения имеет хламидомонада?',
		explanation:
			'Хламидомонада передвигается с помощью двух жгутиков, расположенных на переднем конце клетки.',
		points: 15,
		difficulty_level: 3,
		biology_topic: 'Цитология',
		ege_code: '2.7',
		options: [
			{ option_text: 'Два жгутика', is_correct: true, order_index: 1 },
			{ option_text: 'Реснички', is_correct: false, order_index: 2 },
			{ option_text: 'Ложноножки', is_correct: false, order_index: 3 },
			{ option_text: 'Один жгутик', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Хламидомонада',
		question_text: 'Какой пигмент преобладает в хлоропластах хламидомонады?',
		explanation:
			'Хламидомонада содержит хлорофилл, как и другие зелёные водоросли, что придаёт ей зелёный цвет.',
		points: 20,
		difficulty_level: 3,
		biology_topic: 'Фотосинтез',
		ege_code: '2.6',
		options: [
			{ option_text: 'Хлорофилл', is_correct: true, order_index: 1 },
			{ option_text: 'Фикоцианин', is_correct: false, order_index: 2 },
			{ option_text: 'Фукоксантин', is_correct: false, order_index: 3 },
			{ option_text: 'Каротин', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Хламидомонада',
		question_text: 'Какое размножение характерно для хламидомонады?',
		explanation:
			'Хламидомонада размножается как бесполым путём (зооспорами), так и половым (изогамией).',
		points: 25,
		difficulty_level: 3,
		biology_topic: 'Размножение',
		ege_code: '2.4',
		options: [
			{ option_text: 'Бесполое и половое', is_correct: true, order_index: 1 },
			{ option_text: 'Только бесполое', is_correct: false, order_index: 2 },
			{ option_text: 'Только половое', is_correct: false, order_index: 3 },
			{ option_text: 'Вегетативное', is_correct: false, order_index: 4 },
		],
	},
	// Вопросы для Папоротника (уровень сложности 4)
	{
		plant_name: 'Папоротник',
		question_text: 'Какое поколение преобладает в жизненном цикле папоротника?',
		explanation:
			'У папоротника преобладает спорофит (диплоидное поколение), который является растением, видимым невооружённым глазом.',
		points: 20,
		difficulty_level: 4,
		biology_topic: 'Ботаника',
		ege_code: '2.2',
		options: [
			{ option_text: 'Спорофит', is_correct: true, order_index: 1 },
			{ option_text: 'Гаметофит', is_correct: false, order_index: 2 },
			{ option_text: 'Зигота', is_correct: false, order_index: 3 },
			{ option_text: 'Спора', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Папоротник',
		question_text: 'Где образуются споры у папоротника?',
		explanation:
			'Споры у папоротника образуются в спорангиях, которые собраны в сорусы на нижней стороне листьев (вайях).',
		points: 25,
		difficulty_level: 4,
		biology_topic: 'Размножение растений',
		ege_code: '2.4',
		options: [
			{
				option_text: 'В спорангиях на нижней стороне листьев',
				is_correct: true,
				order_index: 1,
			},
			{ option_text: 'В шишках', is_correct: false, order_index: 2 },
			{ option_text: 'В цветках', is_correct: false, order_index: 3 },
			{ option_text: 'В корнях', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Папоротник',
		question_text: 'Как называется заросток папоротника?',
		explanation:
			'Гаметофит папоротника называется заростком - это маленькое сердцевидное растение, на котором образуются половые клетки.',
		points: 30,
		difficulty_level: 4,
		biology_topic: 'Размножение растений',
		ege_code: '2.4',
		options: [
			{ option_text: 'Заросток', is_correct: true, order_index: 1 },
			{ option_text: 'Протонема', is_correct: false, order_index: 2 },
			{ option_text: 'Проросток', is_correct: false, order_index: 3 },
			{ option_text: 'Спора', is_correct: false, order_index: 4 },
		],
	},
	// Картофель — Размножение (3.1–3.4)
	{
		plant_name: 'Картофель',
		question_text: 'Какой орган картофеля используют для вегетативного размножения?',
		explanation: 'Картофель размножают клубнями — видоизменёнными подземными побегами с запасом питательных веществ.',
		points: 10,
		difficulty_level: 2,
		biology_topic: 'Размножение',
		ege_code: '3.2',
		options: [
			{ option_text: 'Клубень', is_correct: true, order_index: 1 },
			{ option_text: 'Корнеплод', is_correct: false, order_index: 2 },
			{ option_text: 'Луковица', is_correct: false, order_index: 3 },
			{ option_text: 'Семя', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Картофель',
		question_text: 'К какому семейству относится картофель?',
		explanation: 'Картофель относится к семейству Паслёновые (Solanaceae).',
		points: 10,
		difficulty_level: 2,
		biology_topic: 'Систематика',
		ege_code: '4.3',
		options: [
			{ option_text: 'Паслёновые', is_correct: true, order_index: 1 },
			{ option_text: 'Бобовые', is_correct: false, order_index: 2 },
			{ option_text: 'Злаковые', is_correct: false, order_index: 3 },
			{ option_text: 'Розоцветные', is_correct: false, order_index: 4 },
		],
	},
	// Эвглена — Многообразие (4.1–4.2)
	{
		plant_name: 'Эвглена зелёная',
		question_text: 'Чем эвглена питается на свету?',
		explanation: 'На свету эвглена питается автотрофно, за счёт фотосинтеза в хлоропластах.',
		points: 10,
		difficulty_level: 2,
		biology_topic: 'Многообразие',
		ege_code: '4.1',
		options: [
			{ option_text: 'Автотрофно (фотосинтез)', is_correct: true, order_index: 1 },
			{ option_text: 'Только гетеротрофно', is_correct: false, order_index: 2 },
			{ option_text: 'Только паразитизмом', is_correct: false, order_index: 3 },
			{ option_text: 'Хемосинтезом', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Эвглена зелёная',
		question_text: 'С помощью чего эвглена передвигается?',
		explanation: 'Эвглена имеет один жгутик на переднем конце тела.',
		points: 10,
		difficulty_level: 2,
		biology_topic: 'Многообразие',
		ege_code: '4.1',
		options: [
			{ option_text: 'Жгутика', is_correct: true, order_index: 1 },
			{ option_text: 'Ресничек', is_correct: false, order_index: 2 },
			{ option_text: 'Ложноножек', is_correct: false, order_index: 3 },
			{ option_text: 'Мышц', is_correct: false, order_index: 4 },
		],
	},
	// Сосна — Эволюция (6.1–6.5)
	{
		plant_name: 'Сосна обыкновенная',
		question_text: 'Где у сосны образуются семена?',
		explanation: 'Семена сосны развиваются в шишках на семенных чешуях (голосеменные).',
		points: 15,
		difficulty_level: 2,
		biology_topic: 'Эволюция',
		ege_code: '6.2',
		options: [
			{ option_text: 'В шишках', is_correct: true, order_index: 1 },
			{ option_text: 'В плодах', is_correct: false, order_index: 2 },
			{ option_text: 'В спорангиях', is_correct: false, order_index: 3 },
			{ option_text: 'На заростке', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Сосна обыкновенная',
		question_text: 'К какой группе растений относится сосна?',
		explanation: 'Сосна — голосеменное растение; семена лежат открыто на чешуях шишек.',
		points: 10,
		difficulty_level: 2,
		biology_topic: 'Эволюция',
		ege_code: '6.1',
		options: [
			{ option_text: 'Голосеменные', is_correct: true, order_index: 1 },
			{ option_text: 'Покрытосеменные', is_correct: false, order_index: 2 },
			{ option_text: 'Папоротниковидные', is_correct: false, order_index: 3 },
			{ option_text: 'Моховидные', is_correct: false, order_index: 4 },
		],
	},
	// Сфагнум — Экология (7.1–7.5)
	{
		plant_name: 'Сфагнум',
		question_text: 'Где в природе чаще всего растёт сфагнум?',
		explanation: 'Сфагнум типичен для болот и влажных местообитаний; образует торф.',
		points: 10,
		difficulty_level: 2,
		biology_topic: 'Экология',
		ege_code: '7.1',
		options: [
			{ option_text: 'На болотах', is_correct: true, order_index: 1 },
			{ option_text: 'В пустынях', is_correct: false, order_index: 2 },
			{ option_text: 'В степи', is_correct: false, order_index: 3 },
			{ option_text: 'В море', is_correct: false, order_index: 4 },
		],
	},
	{
		plant_name: 'Сфагнум',
		question_text: 'Что образуется из отмершего сфагнума со временем?',
		explanation: 'Сфагновые мхи — главные торфообразователи; из них формируется торф.',
		points: 15,
		difficulty_level: 2,
		biology_topic: 'Экология',
		ege_code: '7.2',
		options: [
			{ option_text: 'Торф', is_correct: true, order_index: 1 },
			{ option_text: 'Каменный уголь', is_correct: false, order_index: 2 },
			{ option_text: 'Нефть', is_correct: false, order_index: 3 },
			{ option_text: 'Известняк', is_correct: false, order_index: 4 },
		],
	},
];

// seed-biogarden.ts (упрощенная версия)
async function seedBioGardenPlants() {
	const plantCount = await BioGardenPlant.count();
	if (plantCount > 0) {
		console.log('Plants already exist, skipping seed...');
		return;
	}

	await sequelize.transaction(async transaction => {
		// Используем bulkCreate для быстрой вставки
		const plants = await BioGardenPlant.bulkCreate(
			plantsSeed.map(plantData => ({
				name: plantData.name,
				scientific_name: plantData.scientific_name,
				description: plantData.description,
				image_url: plantData.image_url || '',
				growth_stages: plantData.growth_stages,
				required_experience: plantData.required_experience,
				biology_topics: plantData.biology_topics,
				difficulty_level: plantData.difficulty_level,
				is_active: true,
			})),
			{ transaction },
		);

		console.log(`Seeded ${plants.length} plants`);
	});
}

// Полноценный сид вопросов из questionsSeed
async function seedBioGardenQuestions() {
	const questionCount = await BioGardenQuestion.count();
	if (questionCount > 0) {
		console.log('Questions already exist, skipping seed...');
		return;
	}

	await sequelize.transaction(async transaction => {
		const plants = await BioGardenPlant.findAll({
			attributes: ['id', 'name'],
			raw: true,
			transaction,
		});

		if (plants.length === 0) {
			console.warn('No plants found for seeding questions');
			return;
		}

		const plantMap = new Map<string, number>();
		plants.forEach(p => {
			plantMap.set(p.name, p.id);
		});

		for (const qSeed of questionsSeed) {
			const plantId = plantMap.get(qSeed.plant_name);
			if (!plantId) {
				console.warn(
					`Plant for question not found, skipping: ${qSeed.plant_name}`,
				);
				continue;
			}

			const question = await BioGardenQuestion.create(
				{
					plant_id: plantId,
					question_text: qSeed.question_text,
					explanation: qSeed.explanation,
					points: qSeed.points,
					difficulty_level: qSeed.difficulty_level,
					biology_topic: qSeed.biology_topic,
					ege_code: qSeed.ege_code,
					timer_seconds: 60,
					is_active: true,
				},
				{ transaction },
			);

			for (const opt of qSeed.options) {
				await BioGardenAnswerOption.create(
					{
						question_id: question.id,
						option_text: opt.option_text,
						is_correct: opt.is_correct,
						order_index: opt.order_index,
					},
					{ transaction },
				);
			}
		}

		console.log(`Seeded ${questionsSeed.length} biogarden questions`);
	});
}

export async function seedBioGardenData() {
	try {
		console.log('Seeding BioGarden data...');
		await seedBioGardenPlants();
		await seedBioGardenQuestions();
		console.log('BioGarden seeding completed!');
	} catch (error) {
		console.error('Error seeding BioGarden data:', error);
		throw error;
	}
}

// Запуск при прямом вызове: npm run seed:biogarden
if (require.main === module) {
	(async () => {
		try {
			await sequelize.authenticate();
			await sequelize.sync({ force: false });
			await seedBioGardenData();
			process.exit(0);
		} catch (e) {
			console.error(e);
			process.exit(1);
		}
	})();
}
