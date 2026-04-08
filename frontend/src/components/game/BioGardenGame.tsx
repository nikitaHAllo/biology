import { useState, useEffect, useCallback, useRef } from 'react';
import {
	Button,
	Group,
	Text,
	Badge,
	Stack,
	Paper,
	Center,
	Loader,
	Image,
	Select,
} from '@mantine/core';
import {
	ArrowLeft,
	Trophy,
	TrendingUp,
	Sprout,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../api';
import type { BioGardenPlant } from '../../models/biogarden';
import { useTelegram } from '../../hooks';
import { BioGardenScene } from './BioGardenScene';

// Заглушка из seed-данных — показывается когда бэкенд недоступен
const MOCK_PLANTS: BioGardenPlant[] = [
	{ id: 1, name: 'Горох посевной', scientific_name: 'Pisum sativum', description: 'Классический объект генетики Менделя', image_url: '', growth_stages: 5, required_experience: 0, difficulty_level: 1, biology_topics: ['Генетика', 'Ботаника'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 2, name: 'Кукуруза', scientific_name: 'Zea mays', description: 'Важная сельскохозяйственная культура', image_url: '', growth_stages: 6, required_experience: 0, difficulty_level: 2, biology_topics: ['Генетика', 'Агрономия'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 3, name: 'Хламидомонада', scientific_name: 'Chlamydomonas', description: 'Одноклеточная зелёная водоросль', image_url: '', growth_stages: 4, required_experience: 0, difficulty_level: 3, biology_topics: ['Цитология', 'Фотосинтез'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 4, name: 'Папоротник', scientific_name: 'Polypodiopsida', description: 'Древнее растение, размножается спорами', image_url: '', growth_stages: 7, required_experience: 0, difficulty_level: 4, biology_topics: ['Ботаника', 'Размножение'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 5, name: 'Эвглена зелёная', scientific_name: 'Euglena viridis', description: 'Пограничный организм между растениями и животными', image_url: '', growth_stages: 5, required_experience: 0, difficulty_level: 5, biology_topics: ['Цитология', 'Систематика'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 6, name: 'Картофель', scientific_name: 'Solanum tuberosum', description: 'Вегетативное размножение клубнями', image_url: '', growth_stages: 6, required_experience: 0, difficulty_level: 6, biology_topics: ['Ботаника', 'Размножение'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 7, name: 'Сфагнум', scientific_name: 'Sphagnum', description: 'Торфяной мох, формирующий болотные экосистемы', image_url: '', growth_stages: 5, required_experience: 0, difficulty_level: 4, biology_topics: ['Ботаника', 'Экология'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
	{ id: 8, name: 'Сосна обыкновенная', scientific_name: 'Pinus sylvestris', description: 'Широко распространённое хвойное дерево Евразии', image_url: '', growth_stages: 8, required_experience: 0, difficulty_level: 3, biology_topics: ['Ботаника', 'Лесоведение'], is_unlocked: false, current_stage: 0, experience_points: 0, health_points: 100, max_health_points: 100, is_completed: false, planted_at: null },
];

const getDifficultyColor = (level: number) => {
	if (level <= 2) return 'green';
	if (level <= 4) return 'yellow';
	if (level <= 5) return 'orange';
	return 'red';
};

const normalizePlantedPlant = (plant: BioGardenPlant): BioGardenPlant => ({
	...plant,
	is_unlocked: true,
	current_stage: Math.max(1, plant.current_stage || 0),
});

const renderFormattedDescription = (description: string) => {
	return description.split('\n').map((line, index) => {
		const trimmed = line.trim();
		if (!trimmed) {
			return <div key={`spacer-${index}`} style={{ height: 6 }} />;
		}

		if (trimmed.endsWith(':')) {
			return (
				<Text
					key={`heading-${index}`}
					c='teal.2'
					fw={700}
					mt={4}
					style={{ fontSize: 'clamp(14px, 1.9vw, 17px)', lineHeight: 1.35 }}
				>
					{trimmed}
				</Text>
			);
		}

		if (trimmed.startsWith('- ')) {
			return (
				<Text
					key={`bullet-${index}`}
					c='gray.2'
					style={{
						fontSize: 'clamp(13px, 1.55vw, 16px)',
						lineHeight: 1.52,
						paddingLeft: 8,
					}}
				>
					• {trimmed.slice(2)}
				</Text>
			);
		}

		return (
			<Text
				key={`paragraph-${index}`}
				c='gray.2'
				style={{ fontSize: 'clamp(13px, 1.55vw, 16px)', lineHeight: 1.58 }}
			>
				{trimmed}
			</Text>
		);
	});
};

const EXTENDED_PLANT_DESCRIPTIONS: Record<number, string> = {
	1: `Горох посевной (Pisum sativum) — однолетнее травянистое растение семейства бобовых, важная пищевая и кормовая культура.

Ботаническое описание:
Корневая система стержневая, может уходить в почву на значительную глубину. На корнях формируются клубеньки с азотфиксирующими бактериями, благодаря которым растение улучшает азотный режим почвы.
Стебель полый, может быть полегающим или более устойчивым (штамбовым), длина зависит от сорта.
Листья сложные, парноперистые, часто заканчиваются усиками для цепляния за опору.
Плоды — бобы с несколькими семенами; семена могут быть гладкими или морщинистыми.

Биологические особенности:
Холодостойкость высокая: семена начинают прорастать уже при низких положительных температурах, а всходы переносят кратковременные заморозки.
Оптимально развивается в умеренном температурном диапазоне; при жаре рост и формирование урожая заметно замедляются.
Критические периоды по влаге — прорастание, цветение и налив бобов.
Предпочитает плодородные нейтральные почвы, плохо переносит кислые и переувлажненные участки.

Агротехника:
Посев проводят ранней весной. В уход входят рыхление, прополка, своевременный полив и установка опор.
Культура отзывчива на фосфорно-калийное питание, азот обычно вносят ограниченно.

Значение:
Горох — источник растительного белка, витаминов и клетчатки.
Используется в свежем виде, для переработки, консервирования и как сидерат.`,
	2: `Кукуруза (Zea mays), или маис, — однолетнее травянистое растение семейства злаков и одна из самых урожайных культур в мире.

Ботаническое описание:
Стебель прямостоячий, плотный, обычно без полости, высотой до 3-4 м и более в зависимости от сорта и условий.
Корневая система мочковатая, хорошо развитая, с возможным образованием опорных воздушных корней в нижней части стебля.
Листья крупные, линейно-ланцетные, с выраженным параллельным жилкованием.
Соцветия раздельнополые: мужская метелка формируется наверху, женские соцветия образуют початки в пазухах листьев.

Биологические особенности:
Культура теплолюбивая: чувствительна к заморозкам и лучше развивается при устойчивом тепле.
Требовательна к свету, особенно в период активного формирования вегетативной массы.
Критический период по влаге — цветение и налив зерна; дефицит воды в эти фазы резко снижает урожай.
Наиболее продуктивна на плодородных структурных почвах с хорошей аэрацией.

Ботанические группы:
В агрономии выделяют группы кукурузы по типу зерна: кремнистая, зубовидная, сахарная, лопающаяся, крахмалистая, восковидная и другие.

Практическое значение:
Используется для производства круп, муки, крахмала, масла, кормов, силоса и биоэтанола.
Имеет исключительное значение для продовольственной и кормовой безопасности, а также для промышленной переработки.`,
	3: `Хламидомонада (Chlamydomonas) — род одноклеточных зеленых водорослей из семейства Хламидомонадовые, преимущественно обитатель пресных вод.

Описание:
Клетки обычно сферические, цилиндрические или удлиненно-веретеновидные.
Ключевая особенность — два передних жгутика одинаковой длины, с помощью которых клетка активно передвигается в воде.
У многих видов наблюдается вращательное движение при плавании, как будто клетка «ввинчивается» в водную среду.

Строение:
Клетка содержит крупный чашевидный хлоропласт с пиреноидом, где идет синтез и запасание веществ фотосинтеза.
Присутствует центральное ядро и сократительные вакуоли, участвующие в осморегуляции.
Есть светочувствительный глазок (стигма), позволяющий ориентироваться по свету для более эффективного фотосинтеза.

Разнообразие и среда обитания:
Описано около 500 видов хламидомонад.
Большинство видов живет в пресных водоемах, но встречаются формы, обитающие в почве, на льду и в снежных покровах.
Некоторые виды: Chlamydomonas angulosa, Chlamydomonas globosa, Chlamydomonas nivalis.

Жизненный цикл:
Преобладают гаплоидные формы; при благоприятных условиях активно идет бесполое размножение зооспорами.
В неблагоприятных условиях запускается половой процесс с образованием зиготы (зигоспоры), устойчивой к стрессу.
После восстановления благоприятных условий происходит мейоз и формируются новые гаплоидные клетки.

Значение:
Хламидомонады важны как продуценты в водных экосистемах.
Используются в научных исследованиях фотосинтеза, генетики и биологии жгутиков.
При массовом развитии могут участвовать в «цветении воды», что влияет на состояние водоема.`,
	4: `Папоротники (папоротниковидные) — отдел высших споровых растений, включающий преимущественно многолетние травянистые формы, а также деревья, лианы, эпифиты и водные виды.

Распространение:
Папоротники встречаются в лесах, на скалах, болотах, в реках и озерах, на стволах деревьев и даже в городской среде.
Наибольшее видовое разнообразие характерно для тропиков и субтропиков.

Строение:
Имеют вегетативные органы (корни, побеги) и развитые ткани: покровные, механические и проводящие.
У многих видов умеренной зоны есть подземное корневище с придаточными корнями.
Листья (вайи) чаще рассеченные, в молодом состоянии обычно спирально свернуты.
На нижней стороне листьев формируются спорангии, в которых созревают споры.

Размножение:
В жизненном цикле чередуются спорофит и гаметофит, при этом доминирует спорофит.
Споры разносятся ветром, прорастают во влажной среде и образуют заросток (гаметофит).
На заростке формируются половые органы; после оплодотворения развивается новое взрослое растение.
Кроме того, у многих видов возможно вегетативное размножение (корневищами, побегами, выводковыми почками).

Примеры видов:
Орляк обыкновенный, страусник обыкновенный, щитовник мужской, костенец волосовидный и другие.

Значение:
Папоротники участвуют в круговороте веществ, формировании микросред и служат укрытием для множества организмов.
Используются в декоративном садоводстве, ландшафтном дизайне и частично в медицине.
Ряд видов чувствителен к изменению климата и нуждается в охране.`,
	5: `Эвглена (Euglena) — род одноклеточных организмов (эвгленид), включающий более тысячи видов, распространенных в пресных и морских водах.

Описание:
Размеры представителей рода обычно варьируют от десятков до сотен микрометров.
Форма клетки может быть веретеновидной, цилиндрической или лентовидной, с заостренным задним концом.

Строение (на примере эвглены зеленой):
Тело покрыто эластичной пелликулой, благодаря которой сохраняется форма и возможны изгибы клетки.
На переднем конце находится длинный жгутик, обеспечивающий движение.
Имеются глазок (светочувствительная структура), сократительная вакуоль, ядро и хлоропласты с хлорофиллом.

Жизнедеятельность:
Эвглена сочетает автотрофный и гетеротрофный типы питания: на свету фотосинтезирует, в темноте может использовать готовые органические вещества.
Газообмен идет через всю поверхность клетки.
Избыток воды и продукты обмена удаляются через сократительную вакуоль.
Размножается бесполым продольным делением клетки.
В неблагоприятных условиях образует цисту, что повышает выживаемость.

Примеры видов:
Эвглена зеленая, эвглена кровавая, эвглена снежная.

Значение:
Эвглены участвуют в самоочищении водоемов и служат пищей для других организмов.
Как фотосинтезирующие протисты, они вносят вклад в кислородный баланс водной среды.
При массовом развитии могут вызывать «цветение воды», ухудшая качество среды для других гидробионтов.`,
	6: `Картофель (Solanum tuberosum), или паслен клубненосный, — важнейшая клубнеплодная культура семейства пасленовых.

Ботаническое описание:
Надземная часть включает стебли, листья и цветки, подземная — столоны и клубни.
Клубни являются видоизмененными побегами, где накапливаются крахмал и другие питательные вещества.
Культура размножается как семенами, так и вегетативно (клубнями).
Цветки могут быть белыми, розовыми или фиолетовыми в зависимости от сорта.

Биологические особенности:
Лучше растет на рыхлых плодородных почвах при умеренной влажности.
Чувствительна к ряду грибных и вирусных болезней, а также к повреждениям при хранении.
Требует соблюдения севооборота и контроля фитосанитарного состояния участка.
В зеленых частях растения и ягодах содержится соланин, поэтому они непригодны в пищу.

Происхождение:
Исторический центр происхождения культуры — Южная Америка; в Европу картофель был завезен в XVI веке.

Агротехника и значение:
В технологии выращивания важны окучивание, полив и защита от вредителей.
Картофель — важный источник углеводов, витаминов и минеральных веществ в рационе человека.
Используется в кулинарии, пищевой промышленности и переработке крахмала.`,
	7: `Сфагнум (Sphagnum), или торфяной мох, — род споровых многолетних мхов, играющий ключевую роль в формировании верховых болот и торфа.

Особенности строения:
Сфагнум — листостебельный мох с тонкими стеблями и мягкими листьями, ветви обычно собраны в пучки.
В тканях присутствуют два типа клеток: крупные мертвые водоносные клетки и мелкие зеленые фотосинтезирующие.
Водоносные клетки способны удерживать воду во много раз больше собственной массы, из-за чего сфагнум работает как природная «губка».
У сфагнума отсутствуют настоящие корни и развитая проводящая система; растение нарастает верхушкой, а нижние части постепенно отмирают, превращаясь в торф.

Распространение и экология:
Широко распространен в умеренной зоне Северного полушария, обитает на болотах, в тундре и сырых лесах.
Активное накопление отмерших остатков способствует заболачиванию территорий и образованию торфяных залежей.

Свойства:
Выраженная гигроскопичность (очень высокая влагоемкость).
Антисептические свойства благодаря фенольным соединениям.
Хорошая воздухопроницаемость и низкая теплопроводность.

Применение:
Используется в садоводстве и цветоводстве как влагоудерживающий и структурирующий субстрат.
Применялся как перевязочный материал благодаря антисептическим свойствам.
Используется в строительстве и других сферах как природный изоляционный и сорбционный материал.`,
	8: `Сосна обыкновенная (Pinus sylvestris) — широко распространенное хвойное дерево семейства Сосновые, один из важнейших лесообразующих видов Евразии.

Описание:
В благоприятных условиях достигает 30-40 м высоты.
Ствол обычно прямой, у взрослых деревьев с характерной рыжевато-оранжевой корой в верхней части.
Хвоя жесткая, чаще по две иголки в пучке, длиной около 4-8 см.
Шишки овально-конические, после созревания раскрываются постепенно.

Биологические особенности:
Сосна светолюбива, плохо переносит сильное затенение.
Отличается зимостойкостью и высокой экологической пластичностью.
Быстро растет в молодом возрасте, затем темпы роста снижаются.
Продолжительность жизни часто достигает 300 лет и более.

Условия произрастания:
Растет на самых разных почвах, включая бедные песчаные и каменистые.
Лучше развивается на свежих супесчаных и легкосуглинистых почвах.
Хорошо переносит засуху, но хуже реагирует на уплотнение и застойное переувлажнение почвы.

Применение:
Древесина широко используется в строительстве, целлюлозно-бумажной и деревообрабатывающей промышленности.
Из живицы получают канифоль и скипидар.
Хвоя служит сырьем для экстрактов, витаминных и косметических продуктов.
В озеленении сосна применяется в парках, санаторных зонах и ландшафтных композициях.`,
};

const EXTENDED_PLANT_DESCRIPTIONS_BY_SCI: Record<string, string> = {
	chlamydomonas: EXTENDED_PLANT_DESCRIPTIONS[3],
	polypodiopsida: EXTENDED_PLANT_DESCRIPTIONS[4],
	'euglena viridis': EXTENDED_PLANT_DESCRIPTIONS[5],
	'solanum tuberosum': EXTENDED_PLANT_DESCRIPTIONS[6],
	sphagnum: EXTENDED_PLANT_DESCRIPTIONS[7],
	'pinus sylvestris': EXTENDED_PLANT_DESCRIPTIONS[8],
	'pisum sativum': EXTENDED_PLANT_DESCRIPTIONS[1],
	'zea mays': EXTENDED_PLANT_DESCRIPTIONS[2],
};

const PLANT_IMAGE_BY_SCI: Record<string, string> = {
	'pisum sativum': '/plants/pisum-sativum.png',
	'zea mays': '/plants/zea-mays.png',
	chlamydomonas: '/plants/chlamydomonas.png',
	polypodiopsida: '/plants/polypodiopsida.png',
	'euglena viridis': '/plants/euglena-viridis.png',
	'solanum tuberosum': '/plants/solanum-tuberosum.png',
	sphagnum: '/plants/sphagnum.png',
	'pinus sylvestris': '/plants/pinus-sylvestris.png',
};

export const BioGardenGame = () => {
	const navigate = useNavigate();
	const [plants, setPlants] = useState<BioGardenPlant[]>(MOCK_PLANTS);
	const [apiOffline, setApiOffline] = useState(false);
	const [selectedPlant, setSelectedPlant] = useState<BioGardenPlant | null>(null);
	const [loading, setLoading] = useState(true);
	const [userCoins, setUserCoins] = useState(0);
	const [totalExperience, setTotalExperience] = useState(0);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
	const [selectedVoice, setSelectedVoice] = useState<string>('__auto__');
	const [speechRate, setSpeechRate] = useState<string>('0.92');
	const speechSessionRef = useRef(0);
	const { user, isLoading: telegramLoading } = useTelegram();

	const telegramId = Number(user?.id);

	const fetchPlants = useCallback(async (): Promise<BioGardenPlant[]> => {
		// Не делаем запрос пока ID не определён
		if (!telegramId || isNaN(telegramId)) {
			setApiOffline(true);
			const normalizedMock = MOCK_PLANTS.map(normalizePlantedPlant);
			setPlants(normalizedMock);
			return normalizedMock;
		}
		try {
			const data = await apiService.getPlantsList(telegramId);
			const normalizedPlants = data.plants.map(normalizePlantedPlant);
			setPlants(normalizedPlants);
			setUserCoins(data.user_coins);
			setTotalExperience(data.total_experience);
			setApiOffline(false);
			return normalizedPlants;
		} catch (error) {
			console.error('Error fetching plants:', error);
			const normalizedMock = MOCK_PLANTS.map(normalizePlantedPlant);
			setPlants(normalizedMock);
			setApiOffline(true);
			return normalizedMock;
		}
	}, [telegramId]);

	useEffect(() => {
		// Ждём пока Telegram контекст готов, потом загружаем
		if (telegramLoading) return;
		fetchPlants().finally(() => setLoading(false));
	}, [fetchPlants, telegramLoading]);

	useEffect(() => {
		if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
		const synth = window.speechSynthesis;
		const updateVoices = () => setAvailableVoices(synth.getVoices());
		updateVoices();
		synth.onvoiceschanged = updateVoices;
		return () => {
			synth.onvoiceschanged = null;
		};
	}, []);

	const handlePlantSelect = (plant: BioGardenPlant) => {
		setSelectedPlant(plant);
	};

	const handleDeselect = () => {
		setSelectedPlant(null);
	};

	const handlePlantHover = (_plant: BioGardenPlant) => {};
	const handlePlantHoverEnd = () => {};

	const handleRandomPlant = () => {
		if (plants.length === 0) return;
		const randomPlant =
			plants[Math.floor(Math.random() * plants.length)];
		if (!randomPlant) return;
		setSelectedPlant(randomPlant);
	};

	const stopSpeaking = useCallback(() => {
		if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
		speechSessionRef.current += 1;
		window.speechSynthesis.cancel();
		setIsSpeaking(false);
		setIsPaused(false);
	}, []);

	const activePlant = selectedPlant;
	const activePlantDescription =
		(activePlant &&
			EXTENDED_PLANT_DESCRIPTIONS_BY_SCI[
				activePlant.scientific_name.trim().toLowerCase()
			]) ||
		(activePlant && EXTENDED_PLANT_DESCRIPTIONS[activePlant.id]) ||
		activePlant?.description ||
		'Описание пока недоступно.';
	const activePlantImageUrl =
		(activePlant &&
			PLANT_IMAGE_BY_SCI[activePlant.scientific_name.trim().toLowerCase()]) ||
		(activePlant?.image_url && activePlant.image_url.trim()) ||
		'';

	const getBestRussianVoice = useCallback((voices: SpeechSynthesisVoice[]) => {
		const ruVoices = voices.filter(v => v.lang.toLowerCase().startsWith('ru'));
		if (ruVoices.length === 0) return null;

		const byPriority = [...ruVoices].sort((a, b) => {
			const score = (name: string) => {
				const n = name.toLowerCase();
				let s = 0;
				if (n.includes('neural')) s += 4;
				if (n.includes('google')) s += 3;
				if (n.includes('microsoft')) s += 2;
				if (n.includes('yandex')) s += 2;
				if (n.includes('female') || n.includes('жен')) s += 1;
				return s;
			};
			return score(b.name) - score(a.name);
		});
		return byPriority[0] ?? ruVoices[0];
	}, []);

	const speakText = useCallback((text: string) => {
		if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

		window.speechSynthesis.cancel();
		const currentSession = speechSessionRef.current + 1;
		speechSessionRef.current = currentSession;

		const paragraphs = text
			.split('\n')
			.map(p => p.trim())
			.filter(Boolean)
			.map(p => p.replace(/^- /, '').replace(/\s+/g, ' '));

		const synthVoices =
			availableVoices.length > 0
				? availableVoices
				: window.speechSynthesis.getVoices();
		const ruVoice =
			selectedVoice === '__auto__'
				? getBestRussianVoice(synthVoices)
				: synthVoices.find(v => v.name === selectedVoice) ?? getBestRussianVoice(synthVoices);
		setIsSpeaking(true);
		setIsPaused(false);

		const speakParagraph = (idx: number) => {
			if (speechSessionRef.current !== currentSession) return;
			if (idx >= paragraphs.length) {
				setIsSpeaking(false);
				setIsPaused(false);
				return;
			}

			const utterance = new SpeechSynthesisUtterance(paragraphs[idx] ?? '');
			utterance.lang = 'ru-RU';
			utterance.rate = Number(speechRate);
			utterance.pitch = 1;
			utterance.volume = 1;
			if (ruVoice) utterance.voice = ruVoice;

			utterance.onend = () => speakParagraph(idx + 1);
			utterance.onerror = () => {
				setIsSpeaking(false);
				setIsPaused(false);
			};
			window.speechSynthesis.speak(utterance);
		};

		speakParagraph(0);
	}, [availableVoices, getBestRussianVoice, selectedVoice, speechRate]);

	const pauseSpeaking = useCallback(() => {
		if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
		window.speechSynthesis.pause();
		setIsPaused(true);
	}, []);

	const resumeSpeaking = useCallback(() => {
		if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
		window.speechSynthesis.resume();
		setIsPaused(false);
	}, []);

	useEffect(() => {
		stopSpeaking();
	}, [activePlant?.id, stopSpeaking]);

	useEffect(() => {
		return () => stopSpeaking();
	}, [stopSpeaking]);

	const voiceOptions = [
		{ value: '__auto__', label: 'Лучший голос (авто)' },
		...availableVoices
			.filter(v => v.lang.toLowerCase().startsWith('ru'))
			.map(v => ({ value: v.name, label: `${v.name} (${v.lang})` })),
	];

	if (loading) {
		return (
			<Center h='100dvh' style={{ background: '#080d1a' }}>
				<Stack align='center' gap='md'>
					<Loader size='lg' color='teal' />
					<Text c='dimmed'>Загружаем сад…</Text>
				</Stack>
			</Center>
		);
	}

	return (
		<div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
			{/* 3D Сцена занимает весь экран */}
			<div style={{ width: '100%', height: '100%' }}>
				<BioGardenScene
					plants={plants}
					selectedPlantId={selectedPlant?.id ?? null}
					onPlantSelect={handlePlantSelect}
					onPlantHover={handlePlantHover}
					onPlantHoverEnd={handlePlantHoverEnd}
					onDeselect={handleDeselect}
				/>
			</div>

			{/* Быстрый выбор */}
			<div
				style={{
					position: 'absolute',
					top: 'clamp(86px, 13vh, 112px)',
					left: 12,
					zIndex: 10,
					pointerEvents: 'all',
				}}
			>
				<Button
					size='xs'
					color='green'
					variant='filled'
					onClick={handleRandomPlant}
					disabled={plants.length === 0}
				>
					Случайное растение
				</Button>
			</div>

			{/* Верхний HUD */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					padding: '10px 14px',
					background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
					zIndex: 10,
					pointerEvents: 'none',
				}}
			>
				<Group justify='space-between' align='center'>
					<Button
						leftSection={<ArrowLeft size={15} />}
						onClick={() => navigate(-1)}
						variant='filled'
						color='dark'
						size='xs'
						style={{ opacity: 0.9, pointerEvents: 'all' }}
					>
						Назад
					</Button>

					<Stack gap={2} align='center'>
						<Text c='white' fw={700} size='md' style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
							🌱 Биосадовник
						</Text>
						{apiOffline && (
							<Badge size='xs' color='red' variant='filled' style={{ pointerEvents: 'all' }}>
								⚠ сервер недоступен
							</Badge>
						)}
					</Stack>

					<Group gap={6}>
						<Paper
							p='5px 10px'
							style={{
								background: 'rgba(0,0,0,0.6)',
								backdropFilter: 'blur(8px)',
								border: '1px solid rgba(255,255,255,0.1)',
								pointerEvents: 'all',
							}}
						>
							<Group gap={5}>
								<Trophy size={13} color='#fbbf24' />
								<Text c='white' size='xs' fw={600}>
									{userCoins}
								</Text>
							</Group>
						</Paper>
						<Paper
							p='5px 10px'
							style={{
								background: 'rgba(0,0,0,0.6)',
								backdropFilter: 'blur(8px)',
								border: '1px solid rgba(255,255,255,0.1)',
								pointerEvents: 'all',
							}}
						>
							<Group gap={5}>
								<TrendingUp size={13} color='#60a5fa' />
								<Text c='white' size='xs' fw={600}>
									{totalExperience} XP
								</Text>
							</Group>
						</Paper>
						<Paper
							p='5px 10px'
							style={{
								background: 'rgba(0,0,0,0.6)',
								backdropFilter: 'blur(8px)',
								border: '1px solid rgba(255,255,255,0.1)',
								pointerEvents: 'all',
							}}
						>
							<Group gap={5}>
								<Sprout size={13} color='#4ade80' />
								<Text c='white' size='xs' fw={600}>
									{plants.filter(p => p.is_unlocked).length}/{plants.length}
								</Text>
							</Group>
						</Paper>
					</Group>
				</Group>
			</div>

			{/* Подсказка при отсутствии выбранного растения */}
			<AnimatePresence>
				{!activePlant && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						transition={{ duration: 0.3 }}
						style={{
							position: 'absolute',
							bottom: 24,
							left: '50%',
							transform: 'translateX(-50%)',
							zIndex: 10,
							pointerEvents: 'none',
						}}
					>
						<Paper
							p='sm'
							style={{
								background: 'rgba(0,0,0,0.7)',
								backdropFilter: 'blur(8px)',
								border: '1px solid rgba(255,255,255,0.12)',
							}}
						>
							<Text c='white' size='sm' ta='center'>
								Нажмите на растение, чтобы открыть полное описание
							</Text>
						</Paper>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Нижняя панель с подробной информацией о растении */}
			<AnimatePresence>
				{activePlant && (
					<motion.div
						initial={{ y: '100%' }}
						animate={{ y: 0 }}
						exit={{ y: '100%' }}
						transition={{ type: 'spring', damping: 28, stiffness: 220 }}
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							zIndex: 10,
							pointerEvents: 'all',
						}}
					>
						<div
							style={{
								background: 'linear-gradient(to top, rgba(5,10,20,0.97) 80%, transparent 100%)',
								backdropFilter: 'blur(12px)',
								padding: '16px 16px 20px',
								maxHeight: '46dvh',
								overflowY: 'auto',
							}}
						>
							<Stack gap={10}>
								{/* Заголовок */}
								<Group justify='space-between' align='flex-start'>
									<div>
										<Text c='white' fw={700} style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', lineHeight: 1.1 }}>
											{activePlant.name}
										</Text>
										<Text
											c='dimmed'
											fs='italic'
											style={{ fontSize: 'clamp(12px, 1.35vw, 15px)', lineHeight: 1.25 }}
										>
											{activePlant.scientific_name}
										</Text>
										{selectedPlant && (
											<Badge mt={6} color='violet' variant='light' size='sm'>
												📌 Закреплено
											</Badge>
										)}
									</div>
									<Badge
										color={getDifficultyColor(activePlant.difficulty_level)}
										variant='filled'
										size='sm'
									>
										Уровень {activePlant.difficulty_level}
									</Badge>
								</Group>

								<div>{renderFormattedDescription(activePlantDescription)}</div>

								<Group gap={8}>
									<Select
										size='xs'
										w={220}
										data={voiceOptions}
										value={selectedVoice}
										onChange={value => setSelectedVoice(value || '__auto__')}
										disabled={isSpeaking}
									/>
									<Select
										size='xs'
										w={110}
										data={[
											{ value: '0.85', label: '0.85x' },
											{ value: '0.92', label: '0.92x' },
											{ value: '1', label: '1.0x' },
											{ value: '1.08', label: '1.08x' },
										]}
										value={speechRate}
										onChange={value => setSpeechRate(value || '0.92')}
										disabled={isSpeaking}
									/>
								</Group>

								<Group gap={8}>
									<Button
										size='xs'
										color='teal'
										onClick={() => speakText(activePlantDescription)}
										disabled={isSpeaking}
									>
										🔊 Озвучить
									</Button>
									<Button
										size='xs'
										variant='light'
										color='blue'
										onClick={pauseSpeaking}
										disabled={!isSpeaking || isPaused}
									>
										⏸ Пауза
									</Button>
									<Button
										size='xs'
										variant='light'
										color='indigo'
										onClick={resumeSpeaking}
										disabled={!isSpeaking || !isPaused}
									>
										▶ Продолжить
									</Button>
									<Button
										size='xs'
										variant='light'
										color='gray'
										onClick={stopSpeaking}
										disabled={!isSpeaking}
									>
										⏹ Стоп
									</Button>
								</Group>

								{activePlantImageUrl && (
									<Stack gap={6}>
										<Text c='dimmed' size='xs'>
											Фото реального растения
										</Text>
										<div
											style={{
												width: 'min(100%, 560px)',
												margin: '0 auto',
												background: 'rgba(255,255,255,0.04)',
												border: '1px solid rgba(255,255,255,0.12)',
												borderRadius: 12,
												padding: 8,
											}}
										>
											<Image
												src={activePlantImageUrl}
												alt={activePlant.name}
												radius='md'
												h='clamp(190px, 30vh, 320px)'
												fit='contain'
												fallbackSrc='https://placehold.co/640x360?text=%D0%A4%D0%BE%D1%82%D0%BE+%D0%BD%D0%B5%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF%D0%BD%D0%BE'
											/>
										</div>
									</Stack>
								)}

								{selectedPlant && (
									<Button variant='subtle' color='gray' size='sm' onClick={handleDeselect}>
										Снять фиксацию
									</Button>
								)}

								{/* Темы */}
								{activePlant.biology_topics?.length > 0 && (
									<Group gap={4} wrap='wrap'>
										{activePlant.biology_topics.map((topic, i) => (
											<Badge key={i} size='xs' variant='dot' color='teal'>
												{topic}
											</Badge>
										))}
									</Group>
								)}
							</Stack>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
