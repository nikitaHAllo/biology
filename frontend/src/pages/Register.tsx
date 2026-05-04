import React, { useState } from 'react';
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLeaf } from '@tabler/icons-react';
import { apiService } from '../api';
import { setAuthTokens } from '../lib/authStorage';

const Register: React.FC = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [username, setUsername] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password.length < 8) {
			notifications.show({ title: 'Пароль', message: 'Минимум 8 символов', color: 'orange' });
			return;
		}
		setLoading(true);
		try {
			const result = await apiService.register(
				email.trim(),
				password,
				username.trim() || undefined,
			);
			setAuthTokens(result.accessToken, result.refreshToken);
			notifications.show({ title: 'Добро пожаловать!', message: 'Аккаунт создан', color: 'teal' });
			navigate('/home');
		} catch (err: unknown) {
			const status = (err as any)?.response?.status;
			if (status === 409) {
				notifications.show({ title: 'Аккаунт уже есть', message: 'Введите пароль чтобы войти', color: 'orange' });
				navigate(`/login?email=${encodeURIComponent(email.trim())}`);
				return;
			}
			const msg = (err as any)?.response?.data?.message ?? 'Не удалось зарегистрироваться';
			notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box
			style={{
				minHeight: '100dvh',
				background: 'linear-gradient(160deg, #0d2818 0%, #1b4332 45%, #2d6a4f 100%)',
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
					style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)' }}
				>
					<Stack gap='lg' align='center' mb='md'>
						<IconLeaf size={48} color='var(--mantine-color-teal-6)' />
						<Title order={2} ta='center' c='dark.7'>
							Регистрация
						</Title>
						<Text size='sm' c='dimmed' ta='center'>
							Создай аккаунт в БиоЛаб
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
								Создать аккаунт
							</Button>
						</Stack>
					</form>

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
