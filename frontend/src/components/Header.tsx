import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
	Group,
	Text,
	ThemeIcon,
	UnstyledButton,
	Container,
	Box,
	Tooltip,
} from '@mantine/core';
import {
	IconUser,
	IconBrain,
	IconHome,
	IconBook,
	IconLogin,
	IconLogout,
} from '@tabler/icons-react';
import { clearAuthToken, getAuthToken } from '../lib/authStorage';

interface NavItemProps {
	icon: React.ReactNode;
	label: string;
	to: string;
	isActive: boolean;
	compact?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
	icon,
	label,
	to,
	isActive,
	compact = false,
}) => {
	const buttonContent = (
		<UnstyledButton
			component={NavLink}
			to={to}
			style={{ textDecoration: 'none' }}
		>
			<Group
				p={compact ? 'xs' : 'sm'}
				style={{
					borderRadius: 'md',
					backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
					transition: 'all 0.2s',
					border: isActive
						? '1px solid rgba(255,255,255,0.3)'
						: '1px solid transparent',
					backdropFilter: isActive ? 'blur(10px)' : 'none',
				}}
			>
				<ThemeIcon
					variant={isActive ? 'filled' : 'light'}
					color='white'
					size={compact ? 'md' : 'lg'}
					style={{
						backgroundColor: isActive
							? 'rgba(255,255,255,0.9)'
							: 'rgba(255,255,255,0.1)',
						color: isActive ? 'var(--mantine-color-teal-7)' : 'white',
					}}
				>
					{icon}
				</ThemeIcon>
				{!compact && (
					<Text
						fw={isActive ? 600 : 400}
						c='white'
						size='sm'
						style={{
							opacity: isActive ? 1 : 0.9,
						}}
					>
						{label}
					</Text>
				)}
			</Group>
		</UnstyledButton>
	);

	if (compact) {
		return (
			<Tooltip label={label} position='bottom' withArrow>
				{buttonContent}
			</Tooltip>
		);
	}

	return buttonContent;
};

const Header: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [hasWebAuth, setHasWebAuth] = useState(() => !!getAuthToken());

	useEffect(() => {
		const onAuth = () => setHasWebAuth(!!getAuthToken());
		window.addEventListener('biology-auth-changed', onAuth);
		return () => window.removeEventListener('biology-auth-changed', onAuth);
	}, []);

	const logout = () => {
		clearAuthToken();
		navigate('/');
	};

	const navItems = [
		{ icon: <IconHome size={18} />, label: 'Модули', to: '/home' },
		{ icon: <IconBrain size={18} />, label: 'Викторины', to: '/quiz' },
		{ icon: <IconBook size={18} />, label: 'Mini App', to: '/mini' },
		{ icon: <IconUser size={18} />, label: 'Профиль', to: '/profile' },
	];

	return (
		<Box
			component='header'
			style={{
				background: 'linear-gradient(135deg, #2b7a78 0%, #3aafa9 100%)',
				borderBottom: '1px solid rgba(255,255,255,0.1)',
				boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
				position: 'sticky',
				top: 0,
				zIndex: 100,
				backdropFilter: 'blur(10px)',
			}}
		>
			<Container size='xl' p='md'>
				<Group justify='space-between' h={60}>
					{/* Логотип - красивый вариант с иконкой из 3 */}
					<Group gap='xs'>
						<UnstyledButton
							component={NavLink}
							to='/home'
							style={{ textDecoration: 'none' }}
						>
							<Text
								fw={900}
								size='xl'
								c='white'
								style={{
									fontFamily: 'Georgia, serif',
									textShadow: '0 2px 4px rgba(0,0,0,0.3)',
								}}
							>
								🧬 БиоЛаб
							</Text>
						</UnstyledButton>
					</Group>

					{/* Навигация - компактная версия */}
					<Group gap={4}>
						{navItems.map(item => (
							<NavItem
								key={item.to}
								icon={item.icon}
								label={item.label}
								to={item.to}
								isActive={
									item.to === '/home'
										? location.pathname === '/home' ||
										  location.pathname === '/'
										: location.pathname === item.to
								}
								compact={true}
							/>
						))}
						{hasWebAuth ? (
							<Tooltip label='Выйти из веб-аккаунта' position='bottom' withArrow>
								<UnstyledButton onClick={logout} style={{ padding: '8px' }}>
									<ThemeIcon
										variant='light'
										color='white'
										size='md'
										style={{
											backgroundColor: 'rgba(255,255,255,0.12)',
											color: 'white',
										}}
									>
										<IconLogout size={18} />
									</ThemeIcon>
								</UnstyledButton>
							</Tooltip>
						) : (
							<Tooltip label='Вход (веб)' position='bottom' withArrow>
								<UnstyledButton
									component={NavLink}
									to='/login'
									style={{ padding: '8px', textDecoration: 'none' }}
								>
									<ThemeIcon
										variant='light'
										color='white'
										size='md'
										style={{
											backgroundColor:
												location.pathname === '/login'
													? 'rgba(255,255,255,0.25)'
													: 'rgba(255,255,255,0.12)',
											color: 'white',
										}}
									>
										<IconLogin size={18} />
									</ThemeIcon>
								</UnstyledButton>
							</Tooltip>
						)}
					</Group>

				</Group>
			</Container>
		</Box>
	);
};

export default Header;
