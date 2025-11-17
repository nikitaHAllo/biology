import { useState, useEffect } from 'react';
import { useTelegram } from './useTelegram';
import { apiService } from '../api';
import type {
    UserProfile,
    UserStats,
    LessonProgress,
    Achievement,
} from '../types/models';

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
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [stats, setStats] = useState<UserStats | null>(null);
	const [progress, setProgress] = useState<LessonProgress[]>([]);
	const [achievements, setAchievements] = useState<Achievement[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!user) return;

		const loadUserData = async (): Promise<void> => {
			try {
				setIsLoading(true);
				setError(null);

				const [profileData, statsData, progressData, achievementsData] =
					await Promise.all([
						apiService.getUserProfile(user.id),
						apiService.getUserStats(user.id),
						apiService.getUserProgress(user.id),
						apiService.getUserAchievements(user.id),
					]);

				setProfile(profileData);
				setStats(statsData);
				setProgress(progressData);
				setAchievements(achievementsData);
			} catch (err) {
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
	}, [user]);

	const refreshData = async (): Promise<void> => {
		if (!user) return;

		try {
			setIsLoading(true);
			const [profileData, statsData] = await Promise.all([
				apiService.getUserProfile(user.id),
				apiService.getUserStats(user.id),
			]);

			setProfile(profileData);
			setStats(statsData);
		} catch (err) {
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
