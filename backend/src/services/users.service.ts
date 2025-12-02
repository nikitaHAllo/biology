import { User, WalletTransaction } from '../models';

// Интерфейс для профиля пользователя
interface UserProfile {
	id: number;
	telegram_id: number;
	username: string | null;
	coins: number;
	created_at: Date;
}

export class UsersService {
	// Регистрация/обновление пользователя
	async registerOrUpdateUser(
		telegramId: number,
		username?: string
	): Promise<User> {
		try {
			// Сначала ищем пользователя
			let user = await User.findOne({
				where: { telegram_id: telegramId },
			});

			if (!user) {
				// Создаем нового пользователя
				user = await User.create({
					telegram_id: telegramId,
					username: username || null,
					coins: 10,
				});

				// Перезагружаем пользователя чтобы убедиться что id установлен
				await user.reload();

				// Добавляем стартовую транзакцию
				await WalletTransaction.create({
					user_id: user.get('id'),
					type: 'credit',
					amount: 10,
					source: 'welcome_bonus',
					meta: { reason: 'Приветственный бонус за регистрацию' },
				});
			} else if (user.get('username') !== username) {
				// Обновляем username если изменился
				await user.update({ username: username || null });
			}

			return user;
		} catch (error) {
			console.error('Error registering user:', error);
			throw error;
		}
	}

	// Получить баланс пользователя
	async getUserBalance(telegramId: number): Promise<number> {
		try {
			const user = await User.findOne({
				where: { telegram_id: telegramId },
				attributes: ['coins'],
			});

			return user ? user.get('coins') : 0;
		} catch (error) {
			console.error('Error getting user balance:', error);
			throw error;
		}
	}

	// Получить профиль пользователя
	async getUserProfile(telegramId: number): Promise<UserProfile | null> {
		try {
			const user = await User.findOne({
				where: { telegram_id: telegramId },
				attributes: ['id', 'telegram_id', 'username', 'coins', 'created_at'],
			});

			if (!user) {
				return null;
			}

			// Явно возвращаем объект с правильными типами
			return {
				id: user.get('id'),
				telegram_id: user.get('telegram_id'),
				username: user.get('username'),
				coins: user.get('coins'),
				created_at: user.get('created_at'),
			};
		} catch (error) {
			console.error('Error getting user profile:', error);
			throw error;
		}
	}

	// Альтернативный вариант - с dataValues и явным приведением типа
	async getUserProfileAlt(telegramId: number): Promise<UserProfile | null> {
		try {
			const user = await User.findOne({
				where: { telegram_id: telegramId },
				attributes: ['id', 'telegram_id', 'username', 'coins', 'created_at'],
				raw: true,
			});

			if (!user) {
				return null;
			}

			return user as UserProfile;
		} catch (error) {
			console.error('Error getting user profile:', error);
			throw error;
		}
	}
}

export const usersService = new UsersService();
