import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface UserTaskResultAttributes {
	id: number;
	user_id: number;
	task_id: number;
	is_correct: boolean;
	submitted_at: Date;
}

interface UserTaskResultCreationAttributes
	extends Optional<UserTaskResultAttributes, 'id' | 'submitted_at'> {}

export class UserTaskResult
	extends Model<UserTaskResultAttributes, UserTaskResultCreationAttributes>
	implements UserTaskResultAttributes
{
	public id!: number;
	public user_id!: number;
	public task_id!: number;
	public is_correct!: boolean;
	public submitted_at!: Date;
}

UserTaskResult.init(
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
		task_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'tasks',
				key: 'id',
			},
		},
		is_correct: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		submitted_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'user_task_results',
		underscored: true,
		timestamps: true,
		createdAt: 'submitted_at',
		updatedAt: false,
	}
);
