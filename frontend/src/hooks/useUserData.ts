import { useState, useEffect } from 'react';
import { useTelegram } from './useTelegram';
import { apiService } from '../api';
import { getAuthToken } from '../lib/authStorage';
import type {
	UserProfile,
	UserStats,
	LessonProgress,
	Achievement,
} from '../models';

interface UseUserDataReturn {
	profile: UserProfile | null;
	stats: UserStats | null;
	progress: LessonProgress[];
	achievements: Achievement[];
	isLoading: boolean;
	error: string | null;
	refreshData: () => Promise<void>;
}

export const useUserData = (): UseUserDataReturn => {
	const { user } = useTelegram();
	const [authTick, setAuthTick] = useState(0);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [stats, setStats] = useState<UserStats | null>(null);
	const [progress, setProgress] = useState<LessonProgress[]>([]);
	const [achievements, setAchievements] = useState<Achievement[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const onAuth = () => setAuthTick(t => t + 1);
		window.addEventListener('biology-auth-changed', onAuth);
		return () => window.removeEventListener('biology-auth-changed', onAuth);
	}, []);

	useEffect(() => {
		const token = getAuthToken();
		if (!user && !token) {
			setProfile(null);
			setStats(null);
			setProgress([]);
			setAchievements([]);
			setIsLoading(false);
			setError(null);
			return;
		}

		const telegramId = user?.id ?? 0;

		const loadUserData = async (): Promise<void> => {
			try {
				setIsLoading(true);
				setError(null);

				const [profileData, statsData, progressData, achievementsData] =
					await Promise.all([
						apiService.getUserProfile(telegramId),
						apiService.getUserStats(telegramId),
						apiService.getUserProgress(telegramId),
						apiService.getUserAchievements(telegramId),
					]);

				setProfile(profileData);
				setStats(statsData);
				setProgress(progressData);
				setAchievements(achievementsData);
			} catch (err: unknown) {
				const errorMessage =
					err instanceof Error
						? err.message
						: 'Не удалось загрузить данные пользователя';
				console.error('Error loading user data:', err);
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		loadUserData();
	}, [user, authTick]);

	const refreshData = async (): Promise<void> => {
		const token = getAuthToken();
		if (!user && !token) return;

		const telegramId = user?.id ?? 0;

		try {
			setIsLoading(true);
			const [profileData, statsData] = await Promise.all([
				apiService.getUserProfile(telegramId),
				apiService.getUserStats(telegramId),
			]);

			setProfile(profileData);
			setStats(statsData);
		} catch (err: unknown) {
			console.error('Error refreshing data:', err);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		profile,
		stats,
		progress,
		achievements,
		isLoading,
		error,
		refreshData,
	};
};
