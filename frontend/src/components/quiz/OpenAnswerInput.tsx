import { useState, useEffect } from 'react';
import { Textarea, Button, Card, Text, Badge, Group, Stack, Alert } from '@mantine/core';
import { IconCheck, IconClock, IconSend } from '@tabler/icons-react';
import { apiService } from '../../api';
import type { OpenAnswerData } from '../../api';

const REVIEW_COST = 10;

interface Props {
	questionId: number;
	quizId: number;
	userCoins: number;
	onCoinsChanged: (newCoins: number) => void;
}

export const OpenAnswerInput = ({ questionId, quizId, userCoins, onCoinsChanged }: Props) => {
	const [text, setText] = useState('');
	const [saved, setSaved] = useState<OpenAnswerData | null>(null);
	const [saving, setSaving] = useState(false);
	const [requesting, setRequesting] = useState(false);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
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

	return (
		<Stack gap='sm'>
			<Textarea
				value={text}
				onChange={e => setText(e.currentTarget.value)}
				placeholder='Напишите развёрнутый ответ...'
				autosize
				minRows={4}
				maxRows={12}
				disabled={isPending || isReviewed}
				style={{ whiteSpace: 'pre-wrap' }}
			/>

			{/* Save button */}
			{!isPending && !isReviewed && (
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

			{/* Request review */}
			{isSaved && !isDirty && !isPending && !isReviewed && (
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
			{isReviewed && (
				<Alert icon={<IconCheck size={16} />} color='green' variant='light'>
					<Stack gap={4}>
						<Group>
							<Text size='sm' fw={600}>Проверено!</Text>
							<Badge color='green'>Балл: {saved?.score ?? '—'}</Badge>
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
