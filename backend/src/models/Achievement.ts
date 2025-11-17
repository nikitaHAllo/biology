import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface AchievementAttributes {
	id: number;
	code: string;
	title: string;
	description: string | null;
	created_at: Date;
}

interface AchievementCreationAttributes
	extends Optional<AchievementAttributes, 'id' | 'created_at'> {}

export class Achievement
	extends Model<AchievementAttributes, AchievementCreationAttributes>
	implements AchievementAttributes
{
	public id!: number;
	public code!: string;
	public title!: string;
	public description!: string | null;
	public created_at!: Date;
}

Achievement.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		code: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
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
		tableName: 'achievements',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	}
);
