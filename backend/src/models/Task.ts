import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface TaskAttributes {
	id: number;
	lesson_id: number;
	type: 'single' | 'multiple' | 'text';
	question: string;
	options: Record<string, unknown> | null; // JSONB
	answer: Record<string, unknown> | null; // JSONB
	reward_coins: number;
	created_at: Date;
}

interface TaskCreationAttributes
	extends Optional<TaskAttributes, 'id' | 'reward_coins' | 'created_at'> {}

export class Task
	extends Model<TaskAttributes, TaskCreationAttributes>
	implements TaskAttributes
{
	public id!: number;
	public lesson_id!: number;
	public type!: 'single' | 'multiple' | 'text';
	public question!: string;
	public options!: Record<string, unknown> | null;
	public answer!: Record<string, unknown> | null;
	public reward_coins!: number;
	public created_at!: Date;
}

Task.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		lesson_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'lessons',
				key: 'id',
			},
		},
		type: {
			type: DataTypes.ENUM('single', 'multiple', 'text'),
			allowNull: false,
		},
		question: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		options: {
			type: DataTypes.JSONB,
			allowNull: true,
		},
		answer: {
			type: DataTypes.JSONB,
			allowNull: true,
		},
		reward_coins: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'tasks',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	}
);
