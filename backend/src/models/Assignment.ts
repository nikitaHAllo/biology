import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface AssignmentAttributes {
	id: number;
	lesson_id: number;
	title: string;
	requirements: string | null;
	answer_elements: Record<string, unknown> | null; // JSONB
	created_at: Date;
}

interface AssignmentCreationAttributes
	extends Optional<AssignmentAttributes, 'id' | 'created_at'> {}

export class Assignment
	extends Model<AssignmentAttributes, AssignmentCreationAttributes>
	implements AssignmentAttributes
{
	public id!: number;
	public lesson_id!: number;
	public title!: string;
	public requirements!: string | null;
	public answer_elements!: Record<string, unknown> | null;
	public created_at!: Date;
}

Assignment.init(
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
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		requirements: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		answer_elements: {
			type: DataTypes.JSONB,
			allowNull: true,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'assignments',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	}
);
