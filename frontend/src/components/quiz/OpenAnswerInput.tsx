import { useState, useEffect } from 'react';
import { Textarea, Button, Card, Text, Badge, Group, Stack, Alert, Collapse, Divider } from '@mantine/core';
import { IconCheck, IconClock, IconSend, IconEye, IconEyeOff, IconBook, IconRefresh } from '@tabler/icons-react';
import { apiService } from '../../api';
import type { OpenAnswerData } from '../../api';

const REVIEW_COST = 10;

interface Props {
	questionId: number;
	quizId: number;
	userCoins: number;
	onCoinsChanged: (newCoins: number) => void;
	explanation?: string | null;
}

export const OpenAnswerInput = ({ questionId, quizId, userCoins, onCoinsChanged, explanation }: Props) => {
	const [text, setText] = useState('');
	const [saved, setSaved] = useState<OpenAnswerData | null>(null);
	const [saving, setSaving] = useState(false);
	const [requesting, setRequesting] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const [showExplanation, setShowExplanation] = useState(false);
	// Allows re-answering even after teacher review
	const [reAnswering, setReAnswering] = useState(false);

	useEffect(() => {
		setShowExplanation(false);
		setReAnswering(false);
		let cancelled = false;
		apiService.getOpenAnswer(questionId).then(({ answer }) => {
			if (cancelled) return;
			if (answer) {
				setSaved(answer);
				setText(answer.answer_text);
			}
			setLoaded(true);
		}).catch(() => setLoaded(true));
		return () => { cancelled = true; };
	}, [questionId]);

	async function handleSave() {
		if (!text.trim()) return;
		setSaving(true);
		try {
			const { answer } = await apiService.submitOpenAnswer(questionId, quizId, text);
			setSaved(answer);
		} catch {
			// ignore
		} finally {
			setSaving(false);
		}
	}

	async function handleRequestReview() {
		if (!saved) return;
		setRequesting(true);
		try {
			const result = await apiService.requestOpenAnswerReview(saved.id);
			setSaved(result.answer);
			onCoinsChanged(result.coins_left);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Ошибка';
			alert(msg);
		} finally {
			setRequesting(false);
		}
	}

	if (!loaded) return null;

	const isReviewed = saved?.review_status === 'reviewed';
	const isPending = saved?.review_status === 'pending';
	const isSaved = !!saved;
	const isDirty = text.trim() !== (saved?.answer_text ?? '').trim();
	const canSeeExplanation = !!explanation && isSaved && !isDirty && !reAnswering;
	const isEditable = reAnswering || (!isPending && !isReviewed);

	return (
		<Stack gap='sm'>
			<Textarea
				value={text}
				onChange={e => setText(e.currentTarget.value)}
				placeholder='Напишите развёрнутый ответ...'
				autosize
				minRows={4}
				maxRows={12}
				disabled={!isEditable}
				style={{ whiteSpace: 'pre-wrap' }}
			/>

			{/* Save button */}
			{isEditable && (
				<Group>
					<Button
						leftSection={<IconSend size={16} />}
						onClick={handleSave}
						loading={saving}
						disabled={!text.trim() || (!isDirty && isSaved)}
						variant='filled'
					>
						{isSaved && !isDirty ? 'Ответ сохранён' : 'Сохранить ответ'}
					</Button>
					{isSaved && !isDirty && (
						<Text size='sm' c='dimmed'>Изменить ответ можно до запроса проверки</Text>
					)}
				</Group>
			)}

			{/* Explanation block (self-check) */}
			{canSeeExplanation && (
				<Card withBorder padding='sm' bg='teal.0'>
					<Stack gap='xs'>
						<Group justify='space-between' align='center'>
							<Group gap='xs'>
								<IconBook size={16} color='var(--mantine-color-teal-7)' />
								<Text size='sm' fw={600} c='teal.8'>Пояснение к ответу</Text>
							</Group>
							<Button
								size='xs'
								variant='subtle'
								color='teal'
								leftSection={showExplanation ? <IconEyeOff size={14} /> : <IconEye size={14} />}
								onClick={() => setShowExplanation(v => !v)}
							>
								{showExplanation ? 'Скрыть' : 'Посмотреть'}
							</Button>
						</Group>
						<Collapse in={showExplanation}>
							<Divider my='xs' color='teal.2' />
							<Text size='sm' style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
								{explanation}
							</Text>
						</Collapse>
						{!showExplanation && (
							<Text size='xs' c='teal.6'>
								Сверьте свой ответ с эталоном — проверка репетитора необязательна
							</Text>
						)}
					</Stack>
				</Card>
			)}

			{/* Request review */}
			{isSaved && !isDirty && !isPending && !isReviewed && !reAnswering && (
				<>
					{canSeeExplanation && <Divider label='или получить оценку репетитора' labelPosition='center' />}
					<Card withBorder padding='sm' bg='blue.0'>
						<Group justify='space-between' align='center'>
							<Stack gap={2}>
								<Text size='sm' fw={500}>Запросить проверку у преподавателя</Text>
								<Text size='xs' c='dimmed'>
									Стоимость: {REVIEW_COST} монет · У вас: {userCoins} монет
								</Text>
							</Stack>
							<Button
								leftSection={<IconCheck size={16} />}
								onClick={handleRequestReview}
								loading={requesting}
								disabled={userCoins < REVIEW_COST}
								color='blue'
								variant='light'
							>
								Запросить ({REVIEW_COST} монет)
							</Button>
						</Group>
						{userCoins < REVIEW_COST && (
							<Text size='xs' c='red' mt={4}>Недостаточно монет для запроса проверки</Text>
						)}
					</Card>
				</>
			)}

			{/* Pending status */}
			{isPending && (
				<Alert icon={<IconClock size={16} />} color='orange' variant='light'>
					<Group justify='space-between'>
						<Text size='sm'>Ответ отправлен на проверку. Ожидайте комментария преподавателя.</Text>
						<Badge color='orange'>Ожидает проверки</Badge>
					</Group>
				</Alert>
			)}

			{/* Reviewed result */}
			{isReviewed && !reAnswering && (
				<Alert icon={<IconCheck size={16} />} color='green' variant='light'>
					<Stack gap={4}>
						<Group justify='space-between' align='flex-start'>
							<Group gap='xs'>
								<Text size='sm' fw={600}>Проверено!</Text>
								<Badge color='green'>Балл: {saved?.score ?? '—'}</Badge>
							</Group>
							<Button
								size='xs'
								variant='subtle'
								color='gray'
								leftSection={<IconRefresh size={12} />}
								onClick={() => { setReAnswering(true); setText(''); }}
							>
								Переответить
							</Button>
						</Group>
						{saved?.teacher_comment && (
							<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>{saved.teacher_comment}</Text>
						)}
					</Stack>
				</Alert>
			)}
		</Stack>
	);
};
