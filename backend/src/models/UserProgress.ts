import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface UserProgressAttributes {
	id: number;
	user_id: number;
	lesson_id: number;
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
	public lesson_id!: number;
	public status!: 'pending' | 'in_progress' | 'completed';
	public updated_at!: Date;
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
		lesson_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'lessons',
				key: 'id',
			},
		},
		status: {
			type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
			allowNull: false,
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
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
