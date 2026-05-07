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
	Progress,
} from '@mantine/core';
import {
	ArrowLeft,
	Trophy,
	TrendingUp,
	Sprout,
	Heart,
	Zap,
	ChevronLeft,
	CheckCircle,
	XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../api';
import type {
	BioGardenPlant,
	BioGardenQuestion,
	SubmitAnswerResponse,
	ReviveAnswerResponse,
} from '../../models/biogarden';
import { useTelegram } from '../../hooks';
import { BioGardenScene } from './BioGardenScene';

type PanelMode = 'info' | 'question' | 'result';
type PlantGameState = 'locked' | 'not_started' | 'active' | 'wilted' | 'sleeping' | 'completed';

const OPTION_LETTERS = ['А', 'Б', 'В', 'Г', 'Д'];

const getDifficultyColor = (level: number) => {
	if (level <= 2) return 'green';
	if (level <= 4) return 'yellow';
	if (level <= 5) return 'orange';
	return 'red';
};

const getHpColor = (hp: number, maxHp: number): string => {
	if (maxHp <= 0) return 'red';
	const pct = (hp / maxHp) * 100;
	if (pct >= 80) return 'green';
	if (pct >= 50) return 'yellow';
	if (pct >= 20) return 'orange';
	return 'red';
};

const getPlantGameState = (plant: BioGardenPlant): PlantGameState => {
	if (!plant.planted_at) {
		return plant.is_unlocked ? 'not_started' : 'locked';
	}
	if (plant.is_completed) return 'completed';
	if (plant.is_wilted) {
		if (plant.revive_sleep_until && new Date(plant.revive_sleep_until) > new Date()) {
			return 'sleeping';
		}
		return 'wilted';
	}
	return 'active';
};

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
					style={{ fontSize: 'clamp(13px, 1.55vw, 16px)', lineHeight: 1.52, paddingLeft: 8 }}
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

export const BioGardenGame = () => {
	const navigate = useNavigate();
	const [plants, setPlants] = useState<BioGardenPlant[]>([]);
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

	// Game state
	const [panelMode, setPanelMode] = useState<PanelMode>('info');
	const [currentQuestion, setCurrentQuestion] = useState<BioGardenQuestion | null>(null);
	const [answerResult, setAnswerResult] = useState<SubmitAnswerResponse | ReviveAnswerResponse | null>(null);
	const [isReviveMode, setIsReviveMode] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const telegramId = Number(user?.id);
	const validTelegramId = telegramId && !isNaN(telegramId) ? telegramId : undefined;

	const updatePlantInState = useCallback((plantId: number, updates: Partial<BioGardenPlant>) => {
		setPlants(prev => prev.map(p => p.id === plantId ? { ...p, ...updates } : p));
		setSelectedPlant(prev => prev?.id === plantId ? { ...prev, ...updates } : prev);
	}, []);

	const fetchPlants = useCallback(async (): Promise<BioGardenPlant[]> => {
		try {
			const data = await apiService.getPlantsList(validTelegramId);
			// Normalize current_stage for 3D scene: stage 0 → 1 visually, but don't touch is_unlocked
			const normalized = data.plants.map(p => ({
				...p,
				current_stage: Math.max(p.current_stage || 0, 0),
			}));
			setPlants(normalized);
			setUserCoins(data.user_coins);
			setTotalExperience(data.total_experience);
			setApiOffline(false);
			return normalized;
		} catch (error) {
			console.error('Error fetching plants:', error);
			setPlants([]);
			setApiOffline(true);
			return [];
		}
	}, [validTelegramId]);

	useEffect(() => {
		if (telegramLoading) return;
		fetchPlants().finally(() => setLoading(false));
	}, [fetchPlants, telegramLoading]);

	// Reset panel when plant selection changes
	useEffect(() => {
		setPanelMode('info');
		setCurrentQuestion(null);
		setAnswerResult(null);
		setActionError(null);
		setIsReviveMode(false);
	}, [selectedPlant?.id]);

	useEffect(() => {
		if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
		const synth = window.speechSynthesis;
		const updateVoices = () => setAvailableVoices(synth.getVoices());
		updateVoices();
		synth.onvoiceschanged = updateVoices;
		return () => { synth.onvoiceschanged = null; };
	}, []);

	const stopSpeaking = useCallback(() => {
		if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
		speechSessionRef.current += 1;
		window.speechSynthesis.cancel();
		setIsSpeaking(false);
		setIsPaused(false);
	}, []);

	useEffect(() => { stopSpeaking(); }, [selectedPlant?.id, stopSpeaking]);
	useEffect(() => { return () => stopSpeaking(); }, [stopSpeaking]);

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
		const synthVoices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
		const ruVoice =
			selectedVoice === '__auto__'
				? getBestRussianVoice(synthVoices)
				: synthVoices.find(v => v.name === selectedVoice) ?? getBestRussianVoice(synthVoices);
		setIsSpeaking(true);
		setIsPaused(false);
		const speakParagraph = (idx: number) => {
			if (speechSessionRef.current !== currentSession) return;
			if (idx >= paragraphs.length) { setIsSpeaking(false); setIsPaused(false); return; }
			const utterance = new SpeechSynthesisUtterance(paragraphs[idx] ?? '');
			utterance.lang = 'ru-RU';
			utterance.rate = Number(speechRate);
			utterance.pitch = 1;
			utterance.volume = 1;
			if (ruVoice) utterance.voice = ruVoice;
			utterance.onend = () => speakParagraph(idx + 1);
			utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false); };
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

	const handlePlantSelect = (plant: BioGardenPlant) => { setSelectedPlant(plant); };
	const handleDeselect = () => { setSelectedPlant(null); };
	const handlePlantHover = (_plant: BioGardenPlant) => {};
	const handlePlantHoverEnd = () => {};

	const handleRandomPlant = () => {
		if (plants.length === 0) return;
		const randomPlant = plants[Math.floor(Math.random() * plants.length)];
		if (!randomPlant) return;
		setSelectedPlant(randomPlant);
	};

	// ── Game handlers ──────────────────────────────────────────────────────

	const handleStartPlant = async () => {
		if (!activePlant) return;
		setActionLoading(true);
		setActionError(null);
		try {
			const result = await apiService.startPlant(validTelegramId ?? 0, activePlant.id);
			updatePlantInState(activePlant.id, {
				planted_at: new Date().toISOString(),
				is_unlocked: true,
				current_stage: result.progress.current_stage,
				health_points: result.progress.health_points,
				max_health_points: result.progress.max_health_points,
				experience_points: result.progress.experience_points,
				is_wilted: false,
			});
		} catch (e: unknown) {
			const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
			setActionError(msg || 'Ошибка при запуске');
		} finally {
			setActionLoading(false);
		}
	};

	const handleGetQuestion = async (revive = false) => {
		if (!activePlant) return;
		setActionLoading(true);
		setActionError(null);
		try {
			let question: BioGardenQuestion;
			if (revive) {
				const data = await apiService.getBiogardenReviveQuestion(activePlant.id, validTelegramId);
				question = data.question;
				setIsReviveMode(true);
			} else {
				const data = await apiService.getCurrentQuestion(activePlant.id, validTelegramId);
				question = data.question;
				setIsReviveMode(false);
			}
			setCurrentQuestion(question);
			setPanelMode('question');
		} catch (e: unknown) {
			const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
			setActionError(msg || 'Ошибка получения вопроса');
		} finally {
			setActionLoading(false);
		}
	};

	const handleSubmitAnswer = async (optionId: number) => {
		if (!activePlant || !currentQuestion) return;
		setActionLoading(true);
		setActionError(null);
		try {
			if (isReviveMode) {
				const result = await apiService.submitReviveAnswer(
					activePlant.id, currentQuestion.id, optionId, validTelegramId,
				);
				setAnswerResult(result);
				if (result.revived) {
					updatePlantInState(activePlant.id, {
						is_wilted: false,
						is_unlocked: true,
						health_points: result.health_points ?? 40,
						revive_sleep_until: null,
					});
				} else if (result.revive_sleep_until) {
					updatePlantInState(activePlant.id, {
						revive_sleep_until: result.revive_sleep_until,
					});
				}
			} else {
				const result = await apiService.submitBiogardenAnswer(
					activePlant.id, currentQuestion.id, optionId, validTelegramId,
				);
				setAnswerResult(result);
				const p = result.progress;
				const becameWilted = !p.is_unlocked && p.health_points <= 0;
				updatePlantInState(activePlant.id, {
					health_points: p.health_points,
					max_health_points: p.max_health_points,
					current_stage: p.current_stage,
					experience_points: p.experience_points,
					is_completed: p.is_completed,
					is_unlocked: p.is_unlocked,
					...(becameWilted ? { is_wilted: true } : {}),
				});
				if (result.earned_coins > 0) setUserCoins(prev => prev + result.earned_coins);
				if (result.earned_experience > 0) setTotalExperience(prev => prev + result.earned_experience);
			}
			setPanelMode('result');
		} catch (e: unknown) {
			const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
			setActionError(msg || 'Ошибка отправки ответа');
		} finally {
			setActionLoading(false);
		}
	};

	const handleReviveByCoin = async () => {
		if (!activePlant) return;
		setActionLoading(true);
		setActionError(null);
		try {
			const result = await apiService.revivePlant(validTelegramId ?? 0, activePlant.id, 'coins');
			if (result.revived) {
				updatePlantInState(activePlant.id, {
					is_wilted: false,
					is_unlocked: true,
					health_points: result.health_points ?? 40,
					revive_sleep_until: null,
				});
				setUserCoins(prev => prev - (result.coins_spent ?? 50));
			}
		} catch (e: unknown) {
			const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
			setActionError(msg || 'Ошибка реанимации');
		} finally {
			setActionLoading(false);
		}
	};

	const handleWaterPlant = async () => {
		if (!activePlant) return;
		setActionLoading(true);
		setActionError(null);
		try {
			const result = await apiService.waterPlant(validTelegramId ?? 0, activePlant.id);
			updatePlantInState(activePlant.id, { health_points: result.health_points });
			setUserCoins(prev => prev - result.coins_spent);
		} catch (e: unknown) {
			const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
			setActionError(msg || 'Ошибка полива');
		} finally {
			setActionLoading(false);
		}
	};

	const handleContinue = () => {
		setAnswerResult(null);
		setCurrentQuestion(null);
		setActionError(null);
		setPanelMode('info');
	};

	// ── Derived ────────────────────────────────────────────────────────────

	const activePlant = selectedPlant;
	const activePlantDescription = activePlant?.description || 'Описание пока недоступно.';
	const activePlantImageUrl = activePlant?.image_url?.trim() || '';
	const gameState: PlantGameState | null = activePlant ? getPlantGameState(activePlant) : null;

	const voiceOptions = [
		{ value: '__auto__', label: 'Лучший голос (авто)' },
		...availableVoices
			.filter(v => v.lang.toLowerCase().startsWith('ru'))
			.map(v => ({ value: v.name, label: `${v.name} (${v.lang})` })),
	];

	// ── Sub-renders ────────────────────────────────────────────────────────

	const renderGameStatus = () => {
		if (!activePlant || !gameState) return null;
		const hpPct = activePlant.max_health_points > 0
			? Math.round((activePlant.health_points / activePlant.max_health_points) * 100)
			: 0;
		const stagePct = activePlant.growth_stages > 0
			? Math.round((activePlant.current_stage / activePlant.growth_stages) * 100)
			: 0;
		const hpColor = getHpColor(activePlant.health_points, activePlant.max_health_points || 100);

		return (
			<Paper
				p='sm'
				style={{
					background: 'rgba(255,255,255,0.05)',
					border: '1px solid rgba(255,255,255,0.1)',
					borderRadius: 10,
				}}
			>
				<Stack gap={8}>
					{activePlant.planted_at && (
						<>
							<Group gap={8} align='center'>
								<Heart size={14} color='#f87171' style={{ flexShrink: 0 }} />
								<Progress value={hpPct} color={hpColor} size='sm' style={{ flex: 1 }} />
								<Text size='xs' c='dimmed' style={{ minWidth: 64, textAlign: 'right' }}>
									{activePlant.health_points}/{activePlant.max_health_points} HP
								</Text>
							</Group>
							<Group gap={8} align='center'>
								<Sprout size={14} color='#4ade80' style={{ flexShrink: 0 }} />
								<Progress value={stagePct} color='teal' size='sm' style={{ flex: 1 }} />
								<Text size='xs' c='dimmed' style={{ minWidth: 64, textAlign: 'right' }}>
									Стадия {activePlant.current_stage}/{activePlant.growth_stages}
								</Text>
							</Group>
						</>
					)}

					{gameState === 'not_started' && (
						<Button size='xs' color='green' fullWidth onClick={handleStartPlant} loading={actionLoading}>
							🌱 Начать выращивать
						</Button>
					)}

					{gameState === 'active' && (
						<Group gap={8}>
							<Button
								size='xs'
								color='blue'
								style={{ flex: 1 }}
								onClick={() => handleGetQuestion(false)}
								loading={actionLoading}
							>
								❓ Ответить на вопрос
							</Button>
							<Button
								size='xs'
								color='cyan'
								variant='light'
								onClick={handleWaterPlant}
								loading={actionLoading}
							>
								💧 Полить (10 🪙)
							</Button>
						</Group>
					)}

					{gameState === 'wilted' && (
						<Stack gap={6}>
							<Text c='orange' size='xs' ta='center'>⚠️ Растение завяло!</Text>
							<Group gap={8}>
								<Button
									size='xs'
									color='teal'
									style={{ flex: 1 }}
									onClick={() => handleGetQuestion(true)}
									loading={actionLoading}
								>
									🔄 Реанимировать (вопрос)
								</Button>
								<Button
									size='xs'
									color='orange'
									variant='light'
									onClick={handleReviveByCoin}
									loading={actionLoading}
								>
									💰 50 🪙
								</Button>
							</Group>
						</Stack>
					)}

					{gameState === 'sleeping' && activePlant.revive_sleep_until && (
						<Text c='orange' size='xs' ta='center'>
							😴 Растение в спячке до{' '}
							{new Date(activePlant.revive_sleep_until).toLocaleString('ru-RU', {
								day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
							})}
						</Text>
					)}

					{gameState === 'completed' && (
						<Badge color='teal' variant='filled' size='sm' style={{ textAlign: 'center', display: 'block' }}>
							✅ Выращено полностью!
						</Badge>
					)}

					{gameState === 'locked' && (
						<Text c='dimmed' size='xs' ta='center'>
							🔒 Сначала вырастите предыдущее растение
						</Text>
					)}

					{actionError && <Text c='red' size='xs'>{actionError}</Text>}
				</Stack>
			</Paper>
		);
	};

	const renderQuestionPanel = () => {
		if (!currentQuestion) return null;
		return (
			<Stack gap={12}>
				<Group gap={8} align='center'>
					<Button
						size='xs'
						variant='subtle'
						color='gray'
						leftSection={<ChevronLeft size={14} />}
						onClick={() => setPanelMode('info')}
					>
						Назад
					</Button>
					{isReviveMode && <Badge color='orange' size='sm'>Реанимация</Badge>}
					<Badge color='blue' size='xs' variant='light'>
						{currentQuestion.biology_topic}
					</Badge>
					{currentQuestion.ege_code && (
						<Badge color='gray' size='xs' variant='outline'>
							ЕГЭ {currentQuestion.ege_code}
						</Badge>
					)}
				</Group>

				<Text
					c='white'
					fw={600}
					style={{ fontSize: 'clamp(14px, 2vw, 18px)', lineHeight: 1.45 }}
				>
					{currentQuestion.question_text}
				</Text>

				<Stack gap={8}>
					{currentQuestion.options.map((opt, idx) => (
						<Button
							key={opt.id}
							variant='light'
							color='blue'
							justify='flex-start'
							fullWidth
							disabled={actionLoading}
							onClick={() => handleSubmitAnswer(opt.id)}
							style={{
								textAlign: 'left',
								height: 'auto',
								minHeight: 44,
								whiteSpace: 'normal',
								padding: '8px 14px',
							}}
						>
							<Group gap={10} align='flex-start' wrap='nowrap'>
								<Text fw={700} c='blue.3' style={{ minWidth: 20, fontSize: 15, flexShrink: 0 }}>
									{OPTION_LETTERS[idx] ?? String(idx + 1)})
								</Text>
								<Text style={{ fontSize: 'clamp(13px, 1.7vw, 16px)', lineHeight: 1.45, textAlign: 'left' }}>
									{opt.option_text}
								</Text>
							</Group>
						</Button>
					))}
				</Stack>

				{actionError && <Text c='red' size='xs'>{actionError}</Text>}
			</Stack>
		);
	};

	const renderResultPanel = () => {
		if (!answerResult || !currentQuestion) return null;
		const isCorrect = answerResult.is_correct;

		if (isReviveMode) {
			const revResult = answerResult as ReviveAnswerResponse;
			return (
				<Stack gap={12}>
					<Group gap={10} align='center'>
						{isCorrect
							? <CheckCircle size={28} color='#4ade80' />
							: <XCircle size={28} color='#f87171' />
						}
						<Text c={isCorrect ? 'green.4' : 'red.4'} fw={700} size='lg'>
							{isCorrect ? '🌿 Растение ожило!' : '❌ Неверно'}
						</Text>
					</Group>

					{!isCorrect && revResult.revive_sleep_until && (
						<Text c='orange' size='sm'>
							😴 Растение уснуло до{' '}
							{new Date(revResult.revive_sleep_until).toLocaleString('ru-RU', {
								day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
							})}
						</Text>
					)}

					{!isCorrect && revResult.correct_answer_id != null && (
						<Text c='gray.3' size='sm'>
							Правильный ответ:{' '}
							{currentQuestion.options.find(o => o.id === revResult.correct_answer_id)?.option_text}
						</Text>
					)}

					{revResult.explanation && (
						<Paper
							p='sm'
							style={{
								background: 'rgba(255,255,255,0.04)',
								border: '1px solid rgba(255,255,255,0.08)',
								borderRadius: 8,
							}}
						>
							<Text c='gray.3' size='sm' style={{ lineHeight: 1.5 }}>
								💡 {revResult.explanation}
							</Text>
						</Paper>
					)}

					<Button color={isCorrect ? 'teal' : 'gray'} fullWidth onClick={handleContinue}>
						Продолжить
					</Button>
				</Stack>
			);
		}

		const normResult = answerResult as SubmitAnswerResponse;
		const p = normResult.progress;
		const hpColor = getHpColor(p.health_points, p.max_health_points || 100);
		const hpPct = p.max_health_points > 0
			? Math.round((p.health_points / p.max_health_points) * 100)
			: 0;

		return (
			<Stack gap={10}>
				<Group gap={10} align='center'>
					{isCorrect
						? <CheckCircle size={28} color='#4ade80' />
						: <XCircle size={28} color='#f87171' />
					}
					<Text c={isCorrect ? 'green.4' : 'red.4'} fw={700} size='lg'>
						{isCorrect ? 'Правильно!' : 'Неверно'}
					</Text>
					{isCorrect && normResult.combo_count >= 3 && (
						<Badge color='yellow' leftSection={<Zap size={12} />}>
							Серия {normResult.combo_count}
						</Badge>
					)}
				</Group>

				{isCorrect && (normResult.earned_experience > 0 || normResult.earned_coins > 0) && (
					<Group gap={12}>
						{normResult.earned_experience > 0 && (
							<Text c='blue.3' size='sm' fw={600}>+{normResult.earned_experience} XP</Text>
						)}
						{normResult.earned_coins > 0 && (
							<Text c='yellow.4' size='sm' fw={600}>+{normResult.earned_coins} 🪙</Text>
						)}
						{normResult.animation === 'stage_up' && (
							<Badge color='teal'>🌱 Новая стадия!</Badge>
						)}
					</Group>
				)}

				{!isCorrect && normResult.correct_answer_id != null && (
					<Text c='gray.3' size='sm'>
						Правильный ответ:{' '}
						{currentQuestion.options.find(o => o.id === normResult.correct_answer_id)?.option_text}
					</Text>
				)}

				{normResult.explanation && (
					<Paper
						p='sm'
						style={{
							background: 'rgba(255,255,255,0.04)',
							border: '1px solid rgba(255,255,255,0.08)',
							borderRadius: 8,
						}}
					>
						<Text c='gray.3' size='sm' style={{ lineHeight: 1.5 }}>
							💡 {normResult.explanation}
						</Text>
					</Paper>
				)}

				<Group gap={8} align='center'>
					<Heart size={14} color='#f87171' style={{ flexShrink: 0 }} />
					<Progress value={hpPct} color={hpColor} size='sm' style={{ flex: 1 }} />
					<Text size='xs' c='dimmed' style={{ minWidth: 64, textAlign: 'right' }}>
						{p.health_points}/{p.max_health_points} HP
					</Text>
				</Group>

				{!p.is_unlocked && p.health_points <= 0 && (
					<Text c='orange' size='sm'>⚠️ Растение завяло! Реанимируйте его.</Text>
				)}
				{p.is_completed && (
					<Badge color='teal' variant='filled'>✅ Растение полностью выращено!</Badge>
				)}

				<Button color={isCorrect ? 'teal' : 'gray'} fullWidth onClick={handleContinue}>
					Продолжить
				</Button>
			</Stack>
		);
	};

	// ── Render ─────────────────────────────────────────────────────────────

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
			{/* 3D Сцена */}
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

			{/* Случайное растение */}
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
								<Text c='white' size='xs' fw={600}>{userCoins}</Text>
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
								<Text c='white' size='xs' fw={600}>{totalExperience} XP</Text>
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
									{plants.filter(p => p.planted_at || p.is_unlocked).length}/{plants.length}
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
								Нажмите на растение, чтобы открыть описание и играть
							</Text>
						</Paper>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Нижняя панель */}
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
								maxHeight: '56dvh',
								overflowY: 'auto',
							}}
						>
							{panelMode === 'question' && renderQuestionPanel()}
							{panelMode === 'result' && renderResultPanel()}
							{panelMode === 'info' && (
								<Stack gap={10}>
									{/* Заголовок */}
									<Group justify='space-between' align='flex-start'>
										<div>
											<Text
												c='white'
												fw={700}
												style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', lineHeight: 1.1 }}
											>
												{activePlant.name}
											</Text>
											<Text
												c='dimmed'
												fs='italic'
												style={{ fontSize: 'clamp(12px, 1.35vw, 15px)', lineHeight: 1.25 }}
											>
												{activePlant.scientific_name}
											</Text>
										</div>
										<Badge
											color={getDifficultyColor(activePlant.difficulty_level)}
											variant='filled'
											size='sm'
										>
											Уровень {activePlant.difficulty_level}
										</Badge>
									</Group>

									{/* Игровой статус */}
									{renderGameStatus()}

									{/* Описание */}
									<div>{renderFormattedDescription(activePlantDescription)}</div>

									{/* Управление озвучкой */}
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

									{/* Изображение */}
									{activePlantImageUrl && (
										<Stack gap={6}>
											<Text c='dimmed' size='xs'>Фото реального растения</Text>
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
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
