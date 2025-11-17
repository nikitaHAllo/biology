import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface LessonAttributes {
	id: number;
	course_id: number;
	title: string;
	content: string | null;
	order_index: number;
	created_at: Date;
}

interface LessonCreationAttributes
	extends Optional<LessonAttributes, 'id' | 'created_at' | 'order_index'> {}

export class Lesson
	extends Model<LessonAttributes, LessonCreationAttributes>
	implements LessonAttributes
{
	public id!: number;
	public course_id!: number;
	public title!: string;
	public content!: string | null;
	public order_index!: number;
	public created_at!: Date;
}

Lesson.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		course_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'courses',
				key: 'id',
			},
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		order_index: {
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
		tableName: 'lessons',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	}
);
