import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';
interface UserQuizResultAttributes {
	id: number;
	user_id: number;
	quiz_id: number;
	score: number;
	earned_coins: number;
	is_passed: boolean;
	submitted_at: Date;
}

interface UserQuizResultCreationAttributes
	extends Optional<UserQuizResultAttributes, 'id' | 'submitted_at'> {}

export class UserQuizResult
	extends Model<UserQuizResultAttributes, UserQuizResultCreationAttributes>
	implements UserQuizResultAttributes
{
	public id!: number;
	public user_id!: number;
	public quiz_id!: number;
	public score!: number;
	public earned_coins!: number;
	public is_passed!: boolean;
	public submitted_at!: Date;
}

UserQuizResult.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		quiz_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		score: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		earned_coins: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		is_passed: {
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
		tableName: 'user_quiz_results',
		underscored: true,
		timestamps: true,
		createdAt: 'submitted_at',
		updatedAt: false,
	}
);
