import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
	Box,
	Title,
	TextInput,
	PasswordInput,
	Button,
	Text,
	Stack,
	Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLeaf, IconBrain, IconFlask, IconDna } from '@tabler/icons-react';
import { apiService } from '../api';
import { setAuthTokens } from '../lib/authStorage';

const FEATURES = [
	{ icon: <IconLeaf size={18} />, text: 'Биосадовник — выращивай растения, отвечая на вопросы ЕГЭ' },
	{ icon: <IconDna size={18} />, text: 'Генетический калькулятор — решай задачи по наследственности' },
	{ icon: <IconFlask size={18} />, text: 'Вирусный детектив — расследуй биологические загадки' },
	{ icon: <IconBrain size={18} />, text: 'Тесты и курсы по всем темам школьной программы' },
];

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
			const status = (err as { response?: { status?: number } })?.response?.status;
			if (status === 409) {
				notifications.show({ title: 'Аккаунт уже есть', message: 'Введите пароль чтобы войти', color: 'orange' });
				navigate(`/login?email=${encodeURIComponent(email.trim())}`);
				return;
			}
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
				'Не удалось зарегистрироваться';
			notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box
			style={{
				minHeight: '100dvh',
				background: 'linear-gradient(135deg, #050d18 0%, #071a0e 55%, #050d18 100%)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 16,
			}}
		>
			<Box
				style={{
					width: '100%',
					maxWidth: 900,
					display: 'flex',
					borderRadius: 20,
					overflow: 'hidden',
					boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
					minHeight: 520,
				}}
			>
				{/* Левая панель — только на десктопе */}
				<Box
					visibleFrom='sm'
					style={{
						width: 380,
						flexShrink: 0,
						background: 'linear-gradient(160deg, #052e16 0%, #064e3b 50%, #065f46 100%)',
						padding: '52px 44px',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
					}}
				>
					<IconLeaf size={56} color='#6ee7b7' style={{ marginBottom: 20 }} />
					<Title order={1} c='white' mb={6} style={{ fontSize: 34, lineHeight: 1.15 }}>
						БиоЛаб
					</Title>
					<Text c='green.3' size='md' mb={36} style={{ lineHeight: 1.5 }}>
						Платформа для подготовки к ЕГЭ по биологии
					</Text>
					<Stack gap={18}>
						{FEATURES.map((f, i) => (
							<Box key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
								<Box style={{ color: '#6ee7b7', flexShrink: 0, marginTop: 2 }}>{f.icon}</Box>
								<Text c='green.2' size='sm' style={{ lineHeight: 1.5 }}>
									{f.text}
								</Text>
							</Box>
						))}
					</Stack>
				</Box>

				{/* Правая панель — форма */}
				<Box
					style={{
						flex: 1,
						background: '#ffffff',
						padding: 'clamp(32px, 6vw, 56px) clamp(24px, 6vw, 52px)',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
					}}
				>
					{/* Шапка только для мобилки */}
					<Box hiddenFrom='sm' style={{ textAlign: 'center', marginBottom: 28 }}>
						<IconLeaf size={44} color='var(--mantine-color-teal-6)' />
						<Title order={2} c='dark.7' mt={8}>
							БиоЛаб
						</Title>
					</Box>

					<Title order={2} c='dark.7' mb={4} style={{ fontSize: 'clamp(22px, 3vw, 28px)' }}>
						Создать аккаунт
					</Title>
					<Text c='dimmed' size='sm' mb={32}>
						Присоединяйтесь к платформе БиоЛаб
					</Text>

					<form onSubmit={handleSubmit}>
						<Stack gap='md'>
							<TextInput
								label='Email'
								placeholder='you@example.com'
								type='email'
								required
								size='md'
								value={email}
								onChange={e => setEmail(e.target.value)}
								autoComplete='email'
							/>
							<TextInput
								label='Имя (необязательно)'
								placeholder='Как к тебе обращаться'
								size='md'
								value={username}
								onChange={e => setUsername(e.target.value)}
								autoComplete='nickname'
							/>
							<PasswordInput
								label='Пароль'
								description='Не менее 8 символов'
								placeholder='••••••••'
								required
								size='md'
								value={password}
								onChange={e => setPassword(e.target.value)}
								autoComplete='new-password'
							/>
							<Button type='submit' fullWidth loading={loading} color='teal' size='md' mt={4}>
								Зарегистрироваться
							</Button>
						</Stack>
					</form>

					<Text ta='center' mt={28} size='sm' c='dimmed'>
						Уже есть аккаунт?{' '}
						<Anchor component={Link} to='/login' fw={600} c='teal'>
							Войти
						</Anchor>
					</Text>
				</Box>
			</Box>
		</Box>
	);
};

export default Register;
