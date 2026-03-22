import { Request, Response } from 'express';
import { User, UserTopicMastery, BioGardenPlant } from '../../models';

export class BioGardenReadinessController {
	async getEgeReadiness(req: Request, res: Response) {
		try {
			const { telegramId } = req.query;

			if (!telegramId) {
				return res.status(400).json({
					success: false,
					message: 'telegramId обязателен',
				});
			}

			const user = await User.findOne({
				where: { telegram_id: Number(telegramId) },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'Пользователь не найден',
				});
			}

			const mastery = await UserTopicMastery.findAll({
				where: { user_id: user.id },
				raw: true,
			});

			const plants = await BioGardenPlant.findAll({
				where: { is_active: true },
				raw: true,
			});

			const accuracyPerCode: Record<
				string,
				{ accuracy: number; mastery_level: string }
			> = {};
			let totalWeightedAccuracy = 0;
			let totalWeight = 0;

			mastery.forEach(item => {
				accuracyPerCode[item.ege_code] = {
					accuracy: item.accuracy,
					mastery_level: item.mastery_level,
				};

				const weight = item.total_count || 1;
				totalWeightedAccuracy += item.accuracy * weight;
				totalWeight += weight;
			});

			const overallReadiness =
				totalWeight > 0 ? Math.round(totalWeightedAccuracy / totalWeight) : 0;

			const weakTopics = mastery
				.filter(m => m.accuracy < 60)
				.map(m => m.ege_code);
			const strongTopics = mastery
				.filter(m => m.accuracy > 80)
				.map(m => m.ege_code);

			res.json({
				success: true,
				data: {
					overall_ege_readiness: overallReadiness,
					accuracy_per_ege_code: accuracyPerCode,
					weak_topics: weakTopics,
					strong_topics: strongTopics,
					sections: plants.map(plant => ({
						plant_id: plant.id,
						name: plant.name,
						difficulty_level: plant.difficulty_level,
					})),
				},
			});
		} catch (error) {
			console.error('Error fetching EGE readiness:', error);
			res.status(500).json({
				success: false,
				message: 'Не удалось получить готовность к ЕГЭ',
			});
		}
	}
}

export const bioGardenReadinessController = new BioGardenReadinessController();

