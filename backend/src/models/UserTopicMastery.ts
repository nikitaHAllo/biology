import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface UserTopicMasteryAttributes {
	id: number;
	user_id: number;
	ege_code: string;
	correct_count: number;
	total_count: number;
	accuracy: number;
	mastery_level: 'novice' | 'learning' | 'know' | 'expert';
	created_at: Date;
	updated_at: Date;
}

interface UserTopicMasteryCreationAttributes
	extends Optional<
		UserTopicMasteryAttributes,
		'id' | 'created_at' | 'updated_at' | 'correct_count' | 'total_count' | 'accuracy' | 'mastery_level'
	> {}

export class UserTopicMastery
	extends Model<UserTopicMasteryAttributes, UserTopicMasteryCreationAttributes>
	implements UserTopicMasteryAttributes
{
	public id!: number;
	public user_id!: number;
	public ege_code!: string;
	public correct_count!: number;
	public total_count!: number;
	public accuracy!: number;
	public mastery_level!: 'novice' | 'learning' | 'know' | 'expert';
	public created_at!: Date;
	public updated_at!: Date;
}

UserTopicMastery.init(
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
		ege_code: {
			type: DataTypes.STRING(50),
			allowNull: false,
		},
		correct_count: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		total_count: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		accuracy: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		mastery_level: {
			type: DataTypes.ENUM('novice', 'learning', 'know', 'expert'),
			allowNull: false,
			defaultValue: 'novice',
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'user_topic_mastery',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		indexes: [
			{
				unique: true,
				fields: ['user_id', 'ege_code'],
			},
		],
	},
);

