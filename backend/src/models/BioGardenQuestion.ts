// models/BioGardenQuestion.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

export interface BioGardenQuestionAttributes {
	id: number;
	plant_id: number;
	question_text: string;
	explanation: string;
	points: number;
	difficulty_level: number;
	biology_topic: string;
	ege_code: string;
	timer_seconds?: number;
	is_active: boolean;
	created_at?: Date;
}

interface BioGardenQuestionCreationAttributes extends Optional<
	BioGardenQuestionAttributes,
	'id' | 'created_at' | 'is_active'
> {}

export class BioGardenQuestion
	extends Model<
		BioGardenQuestionAttributes,
		BioGardenQuestionCreationAttributes
	>
	implements BioGardenQuestionAttributes
{
	declare id: number;
	declare plant_id: number;
	declare question_text: string;
	declare explanation: string;
	declare points: number;
	declare difficulty_level: number;
	declare biology_topic: string;
	declare ege_code: string;
	declare timer_seconds?: number;
	declare is_active: boolean;
	declare readonly created_at?: Date;

	// TypeScript декларация для ассоциации
	declare readonly options?: import('./BioGardenAnswerOption').BioGardenAnswerOption[];
}

BioGardenQuestion.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		plant_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'bio_garden_plants',
				key: 'id',
			},
		},
		question_text: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		explanation: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		points: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 10,
		},
		difficulty_level: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
			validate: {
				min: 1,
				max: 10,
			},
		},
		biology_topic: {
			type: DataTypes.STRING(200),
			allowNull: false,
		},
		ege_code: {
			type: DataTypes.STRING(50),
			allowNull: false,
		},
		timer_seconds: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 60,
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
	},
	{
		sequelize,
		tableName: 'bio_garden_questions',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	},
);
