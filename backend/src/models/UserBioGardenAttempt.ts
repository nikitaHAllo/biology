// models/UserBioGardenAttempt.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { BioGardenQuestion } from './BioGardenQuestion';

interface UserBioGardenAttemptAttributes {
	id: number;
	user_id: number;
	plant_id: number;
	stage_number: number;
	question_id: number;
	is_correct: boolean;
	earned_experience: number;
	earned_coins: number;
	hp_before: number | null;
	hp_after: number | null;
	combo_before: number | null;
	combo_after: number | null;
	answered_at: Date;
	created_at: Date;
}

interface UserBioGardenAttemptCreationAttributes extends Optional<
	UserBioGardenAttemptAttributes,
	| 'id'
	| 'created_at'
	| 'hp_before'
	| 'hp_after'
	| 'combo_before'
	| 'combo_after'
> {}

export class UserBioGardenAttempt
	extends Model<
		UserBioGardenAttemptAttributes,
		UserBioGardenAttemptCreationAttributes
	>
	implements UserBioGardenAttemptAttributes
{
	public id!: number;
	public user_id!: number;
	public plant_id!: number;
	public stage_number!: number;
	public question_id!: number;
	public is_correct!: boolean;
	public earned_experience!: number;
	public earned_coins!: number;
	public hp_before!: number | null;
	public hp_after!: number | null;
	public combo_before!: number | null;
	public combo_after!: number | null;
	public answered_at!: Date;
	public created_at!: Date;

	public readonly question?: BioGardenQuestion;
}

UserBioGardenAttempt.init(
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
		plant_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'bio_garden_plants',
				key: 'id',
			},
		},
		stage_number: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		question_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'bio_garden_questions',
				key: 'id',
			},
		},
		is_correct: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		earned_experience: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		earned_coins: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		hp_before: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		hp_after: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		combo_before: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		combo_after: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		answered_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'user_bio_garden_attempts',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
		indexes: [
			{
				fields: ['user_id', 'plant_id', 'stage_number'],
			},
		],
	},
);
