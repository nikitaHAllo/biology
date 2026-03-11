// models/BioGardenAnswerOption.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

export interface BioGardenAnswerOptionAttributes {
	id: number;
	question_id: number;
	option_text: string;
	is_correct: boolean;
	order_index: number;
	created_at?: Date;
}

interface BioGardenAnswerOptionCreationAttributes extends Optional<
	BioGardenAnswerOptionAttributes,
	'id' | 'created_at'
> {}

export class BioGardenAnswerOption
	extends Model<
		BioGardenAnswerOptionAttributes,
		BioGardenAnswerOptionCreationAttributes
	>
	implements BioGardenAnswerOptionAttributes
{
	// Убери публичные поля и используй declare
	declare id: number;
	declare question_id: number;
	declare option_text: string;
	declare is_correct: boolean;
	declare order_index: number;
	declare readonly created_at?: Date;
}

BioGardenAnswerOption.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		question_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'bio_garden_questions',
				key: 'id',
			},
		},
		option_text: {
			type: DataTypes.STRING(500),
			allowNull: false,
		},
		is_correct: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		order_index: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		sequelize,
		tableName: 'bio_garden_answer_options',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	},
);
