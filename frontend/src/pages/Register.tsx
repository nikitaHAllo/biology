import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
	Container,
	Paper,
	Title,
	TextInput,
	PasswordInput,
	Button,
	Text,
	Stack,
	Anchor,
	Box,
	Group,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLeaf, IconMailForward, IconArrowLeft } from '@tabler/icons-react';
import { apiService } from '../api';
import { setAuthToken } from '../lib/authStorage';

type Step = 'form' | 'code';

const Register: React.FC = () => {
	const navigate = useNavigate();
	const [step, setStep] = useState<Step>('form');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [username, setUsername] = useState('');
	const [code, setCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);

	useEffect(() => {
		if (resendCooldown <= 0) return;
		const id = window.setTimeout(
			() => setResendCooldown(c => Math.max(0, c - 1)),
			1000,
		);
		return () => window.clearTimeout(id);
	}, [resendCooldown]);

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password.length < 8) {
			notifications.show({
				title: 'Пароль',
				message: 'Минимум 8 символов',
				color: 'orange',
			});
			return;
		}
		setLoading(true);
		try {
			const result = await apiService.register(
				email.trim(),
				password,
				username.trim() || undefined,
			);
			if (result.needsVerification) {
				notifications.show({
					title: 'Проверь почту',
					message: `Мы отправили 6-значный код на ${result.email}`,
					color: 'teal',
				});
				setStep('code');
				setResendCooldown(60);
			}
		} catch (err: unknown) {
			// Если email уже зарегистрирован, ведём на логин с prefill
			const status =
				typeof err === 'object' &&
				err !== null &&
				'response' in err &&
				(err as any).response &&
				'status' in (err as any).response
					? (err as any).response.status
					: null;

			if (status === 409) {
				notifications.show({
					title: 'Аккаунт уже есть',
					message: 'Введите пароль чтобы войти',
					color: 'orange',
				});
				navigate(`/login?email=${encodeURIComponent(email.trim())}`);
				return;
			}

			const msg =
				err &&
				typeof err === 'object' &&
				'response' in err &&
				err.response &&
				typeof err.response === 'object' &&
				'data' in err.response &&
				err.response.data &&
				typeof err.response.data === 'object' &&
				'message' in err.response.data
					? String((err.response.data as { message?: string }).message)
					: 'Не удалось зарегистрироваться';
			notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
		} finally {
			setLoading(false);
		}
	};

	const handleVerifySubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (code.length !== 6) {
			notifications.show({
				title: 'Код',
				message: 'Нужно 6 цифр',
				color: 'orange',
			});
			return;
		}
		setLoading(true);
		try {
			const result = await apiService.verifyEmail(email.trim(), code);
			notifications.show({
				title: 'Готово!',
				message: 'Почта подтверждена — вход выполнен',
				color: 'teal',
			});
			setAuthToken(result.token);
			navigate('/home');
		} catch (err: unknown) {
			const msg =
				err &&
				typeof err === 'object' &&
				'response' in err &&
				err.response &&
				typeof err.response === 'object' &&
				'data' in err.response &&
				err.response.data &&
				typeof err.response.data === 'object' &&
				'message' in err.response.data
					? String((err.response.data as { message?: string }).message)
					: 'Неверный код';
			notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
		} finally {
			setLoading(false);
		}
	};

	const handleResend = async () => {
		if (resendCooldown > 0) return;
		setLoading(true);
		try {
			await apiService.resendVerificationCode(email.trim());
			notifications.show({
				title: 'Отправлено',
				message: 'Проверь почту ещё раз',
				color: 'teal',
			});
			setResendCooldown(60);
		} catch (err: unknown) {
			const msg =
				err &&
				typeof err === 'object' &&
				'response' in err &&
				err.response &&
				typeof err.response === 'object' &&
				'data' in err.response &&
				err.response.data &&
				typeof err.response.data === 'object' &&
				'message' in err.response.data
					? String((err.response.data as { message?: string }).message)
					: 'Не удалось отправить';
			notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box
			style={{
				minHeight: '100dvh',
				background:
					'linear-gradient(160deg, #0d2818 0%, #1b4332 45%, #2d6a4f 100%)',
				display: 'flex',
				alignItems: 'center',
				padding: '2rem 1rem',
			}}
		>
			<Container size={420}>
				<Paper
					withBorder
					shadow='xl'
					p='xl'
					radius='lg'
					style={{
						background: 'rgba(255,255,255,0.97)',
						backdropFilter: 'blur(12px)',
					}}
				>
					{step === 'form' ? (
						<>
							<Stack gap='lg' align='center' mb='md'>
								<IconLeaf size={48} color='var(--mantine-color-teal-6)' />
								<Title order={2} ta='center' c='dark.7'>
									Регистрация
								</Title>
								<Text size='sm' c='dimmed' ta='center'>
									Укажи почту — пришлём код для подтверждения
								</Text>
							</Stack>

							<form onSubmit={handleFormSubmit}>
								<Stack gap='md'>
									<TextInput
										label='Email'
										placeholder='you@example.com'
										type='email'
										required
										value={email}
										onChange={e => setEmail(e.target.value)}
										autoComplete='email'
									/>
									<TextInput
										label='Имя (необязательно)'
										placeholder='Как к тебе обращаться'
										value={username}
										onChange={e => setUsername(e.target.value)}
										autoComplete='nickname'
									/>
									<PasswordInput
										label='Пароль'
										description='Не менее 8 символов'
										placeholder='••••••••'
										required
										value={password}
										onChange={e => setPassword(e.target.value)}
										autoComplete='new-password'
									/>
									<Button type='submit' fullWidth loading={loading} color='teal'>
										Далее — получить код
									</Button>
								</Stack>
							</form>
						</>
					) : (
						<>
							<Stack gap='lg' align='center' mb='md'>
								<IconMailForward
									size={48}
									color='var(--mantine-color-teal-6)'
								/>
								<Title order={2} ta='center' c='dark.7'>
									Код из письма
								</Title>
								<Text size='sm' c='dimmed' ta='center'>
									Введи 6 цифр, которые пришли на{' '}
									<strong>{email}</strong>
								</Text>
							</Stack>

							<form onSubmit={handleVerifySubmit}>
								<Stack gap='md'>
									<TextInput
										label='Код'
										placeholder='000000'
										maxLength={6}
										required
										value={code}
										onChange={e =>
											setCode(
												e.target.value.replace(/\D/g, '').slice(0, 6),
											)
										}
										inputMode='numeric'
										autoComplete='one-time-code'
										size='lg'
										styles={{ input: { letterSpacing: '0.4em', fontSize: 22 } }}
									/>
									<Button type='submit' fullWidth loading={loading} color='teal'>
										Подтвердить и перейти ко входу
									</Button>
									<Group justify='space-between' gap='xs'>
										<Button
											type='button'
											variant='subtle'
											size='xs'
											leftSection={<IconArrowLeft size={14} />}
											onClick={() => {
												setStep('form');
												setCode('');
											}}
										>
											Назад
										</Button>
										<Button
											type='button'
											variant='light'
											size='xs'
											color='teal'
											loading={loading}
											disabled={resendCooldown > 0}
											onClick={handleResend}
										>
											{resendCooldown > 0
												? `Отправить снова (${resendCooldown} с)`
												: 'Отправить код снова'}
										</Button>
									</Group>
								</Stack>
							</form>
						</>
					)}

					<Text ta='center' mt='lg' size='sm'>
						Уже есть аккаунт?{' '}
						<Anchor component={Link} to='/login' fw={600}>
							Войти
						</Anchor>
					</Text>
				</Paper>
			</Container>
		</Box>
	);
};

export default Register;
