import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface UserMaterialAccessAttributes {
	id: number;
	user_id: number;
	topic_id: number;
	purchased_at: Date;
}

interface UserMaterialAccessCreationAttributes
	extends Optional<UserMaterialAccessAttributes, 'id' | 'purchased_at'> {}

export class UserMaterialAccess
	extends Model<UserMaterialAccessAttributes, UserMaterialAccessCreationAttributes>
	implements UserMaterialAccessAttributes
{
	public id!: number;
	public user_id!: number;
	public topic_id!: number;
	public purchased_at!: Date;
}

UserMaterialAccess.init(
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
		topic_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'material_topics',
				key: 'id',
			},
		},
		purchased_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'user_material_accesses',
		underscored: true,
		timestamps: false,
	}
);


