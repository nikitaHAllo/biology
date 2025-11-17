import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface UserAchievementAttributes {
	id: number;
	user_id: number;
	achievement_id: number;
	awarded_at: Date;
}

interface UserAchievementCreationAttributes
	extends Optional<UserAchievementAttributes, 'id' | 'awarded_at'> {}

export class UserAchievement
	extends Model<UserAchievementAttributes, UserAchievementCreationAttributes>
	implements UserAchievementAttributes
{
	public id!: number;
	public user_id!: number;
	public achievement_id!: number;
	public awarded_at!: Date;
}

UserAchievement.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id',
			},
		},
		achievement_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'achievements',
				key: 'id',
			},
		},
		awarded_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'user_achievements',
		underscored: true,
		timestamps: true,
		createdAt: 'awarded_at',
		updatedAt: false,
	}
);
