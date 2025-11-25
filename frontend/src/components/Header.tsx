import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
	Group,
	Text,
	ThemeIcon,
	UnstyledButton,
	Container,
	Box,
	Tooltip,
} from '@mantine/core';
import { IconUser, IconBrain, IconHome, IconBook } from '@tabler/icons-react';

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

	const navItems = [
		{ icon: <IconHome size={18} />, label: 'Модули', to: '/' },
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
						
					</Group>

					{/* Навигация - компактная версия */}
					<Group gap={4}>
						{navItems.map(item => (
							<NavItem
								key={item.to}
								icon={item.icon}
								label={item.label}
								to={item.to}
								isActive={location.pathname === item.to}
								compact={true}
							/>
						))}
					</Group>

				</Group>
			</Container>
		</Box>
	);
};

export default Header;
