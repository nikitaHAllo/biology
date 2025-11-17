import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface CourseAttributes {
	id: number;
	title: string;
	description: string | null;
	created_at: Date;
}

interface CourseCreationAttributes
	extends Optional<CourseAttributes, 'id' | 'created_at'> {}

export class Course
	extends Model<CourseAttributes, CourseCreationAttributes>
	implements CourseAttributes
{
	public id!: number;
	public title!: string;
	public description!: string | null;
	public created_at!: Date;
}

Course.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
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
		tableName: 'courses',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	}
);
