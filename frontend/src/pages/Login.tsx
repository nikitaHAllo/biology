import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLeaf } from '@tabler/icons-react';
import { apiService } from '../api';
import { setAuthToken } from '../lib/authStorage';

const Login: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const e = searchParams.get('email');
		if (e) setEmail(decodeURIComponent(e));
	}, [searchParams]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const { token } = await apiService.login(email.trim(), password);
			setAuthToken(token);
			notifications.show({
				title: 'С возвращением!',
				message: 'Вы вошли в аккаунт',
				color: 'teal',
			});
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
					: 'Не удалось войти';
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
					'linear-gradient(160deg, #1b4332 0%, #2b7a78 40%, #3aafa9 100%)',
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
					<Stack gap='lg' align='center' mb='md'>
						<IconLeaf size={48} color='var(--mantine-color-teal-6)' />
						<Title order={2} ta='center' c='dark.7'>
							Вход в БиоЛаб
						</Title>
						<Text size='sm' c='dimmed' ta='center'>
							Веб-версия учебной платформы
						</Text>
					</Stack>

					<form onSubmit={handleSubmit}>
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
							<PasswordInput
								label='Пароль'
								placeholder='••••••••'
								required
								value={password}
								onChange={e => setPassword(e.target.value)}
								autoComplete='current-password'
							/>
							<Button type='submit' fullWidth loading={loading} color='teal'>
								Войти
							</Button>
						</Stack>
					</form>

					<Text ta='center' mt='lg' size='sm'>
						Нет аккаунта?{' '}
						<Anchor component={Link} to='/register' fw={600}>
							Регистрация
						</Anchor>
					</Text>
				</Paper>
			</Container>
		</Box>
	);
};

export default Login;
