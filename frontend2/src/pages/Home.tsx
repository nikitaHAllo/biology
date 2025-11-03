import React, { useEffect, useState } from 'react';

type TelegramUser = {
	id: number;
	first_name: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
};

interface TelegramWebApp {
	initDataUnsafe: {
		user: TelegramUser;
	};
	ready: () => void;
}

declare global {
	interface Window {
		Telegram: {
			WebApp: TelegramWebApp;
		};
	}
}

const Profile: React.FC = () => {
	const [user, setUser] = useState<TelegramUser | null>(null);
	const [balance, setBalance] = useState<number | null>(null);

	useEffect(() => {
		const tg = window.Telegram?.WebApp;
		if (tg?.initDataUnsafe?.user) {
			setUser(tg.initDataUnsafe.user);
			tg.ready();
			// Загружаем баланс с backend
			fetchBalance(tg.initDataUnsafe.user.id);
		}
	}, []);

	const fetchBalance = async (userId: number) => {
		try {
			const res = await fetch(
				`http://localhost:3001/api/users/${userId}/balance`
			);
			const data = await res.json();
			setBalance(data.balance);
		} catch (err) {
			console.error('Ошибка загрузки баланса', err);
		}
	};

	if (!user)
		return (
			<div className='text-center text-gray-500 mt-10'>
				Не удалось получить данные пользователя
			</div>
		);

	return (
		<div className='flex flex-col items-center text-center mt-10 space-y-3'>
			<img
				src={user.photo_url || '/default-avatar.png'}
				alt='Аватар'
				className='w-24 h-24 rounded-full shadow-md'
			/>
			<h2 className='text-xl font-semibold text-white'>
				{user.first_name} {user.last_name || ''}
			</h2>
			{user.username && <p className='text-gray-400'>@{user.username}</p>}
			<div className='mt-4 bg-white/10 rounded-xl p-3 w-64'>
				<p className='text-gray-200 text-sm'>💰 Репкоины: {balance ?? '—'}</p>
			</div>
		</div>
	);
};

export default Profile;
