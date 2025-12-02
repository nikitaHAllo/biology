import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface UserProgressAttributes {
	id: number;
	user_id: number;
	quiz_id: number;
	score: number;
	earned_coins: number;
	is_completed: boolean; // ← добавлено
	completed_at: Date | null;
	status: 'pending' | 'in_progress' | 'completed';
	updated_at: Date;
}

interface UserProgressCreationAttributes
	extends Optional<UserProgressAttributes, 'id' | 'updated_at'> {}

export class UserProgress
	extends Model<UserProgressAttributes, UserProgressCreationAttributes>
	implements UserProgressAttributes
{
	public id!: number;
	public user_id!: number;
	public quiz_id!: number;

	public score!: number;
	public earned_coins!: number;
	public is_completed!: boolean;
	public completed_at!: Date | null;

	public status!: 'pending' | 'in_progress' | 'completed';

	public updated_at!: Date;
	public created_at!: Date; // если timestamps: true
}

UserProgress.init(
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
		quiz_id: DataTypes.INTEGER,
		score: DataTypes.INTEGER,
		earned_coins: DataTypes.INTEGER,
		status: {
			type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
			allowNull: false,
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		is_completed: { type: DataTypes.BOOLEAN, defaultValue: false }, // ← добавлено
		completed_at: { type: DataTypes.DATE, allowNull: true },
	},
	{
		sequelize,
		tableName: 'user_progress',
		underscored: true,
		timestamps: true,
		createdAt: false,
		updatedAt: 'updated_at',
	}
);
