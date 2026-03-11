// models/UserBioGardenProgress.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { BioGardenPlant } from './BioGardenPlant';

interface UserBioGardenProgressAttributes {
	id: number;
	user_id: number;
	plant_id: number;
	current_stage: number;
	experience_points: number;
	health_points: number;
	max_health_points: number;
	is_completed: boolean;
	is_unlocked: boolean;
	last_watered_at: Date | null;
	planted_at: Date;
	completed_at: Date | null;
	created_at: Date;
	updated_at: Date;
}

interface UserBioGardenProgressCreationAttributes extends Optional<
	UserBioGardenProgressAttributes,
	| 'id'
	| 'created_at'
	| 'updated_at'
	| 'is_completed'
	| 'is_unlocked'
	| 'current_stage'
	| 'experience_points'
	| 'health_points'
	| 'max_health_points'
	| 'last_watered_at'
	| 'completed_at'
> {}

export class UserBioGardenProgress
	extends Model<
		UserBioGardenProgressAttributes,
		UserBioGardenProgressCreationAttributes
	>
	implements UserBioGardenProgressAttributes
{
	public id!: number;
	public user_id!: number;
	public plant_id!: number;
	public current_stage!: number;
	public experience_points!: number;
	public health_points!: number;
	public max_health_points!: number;
	public is_completed!: boolean;
	public is_unlocked!: boolean;
	public last_watered_at!: Date | null;
	public planted_at!: Date;
	public completed_at!: Date | null;
	public created_at!: Date;
	public updated_at!: Date;

	// TypeScript declaration for associations
	public readonly plant?: BioGardenPlant;
	public readonly user?: import('./User').User;
}

UserBioGardenProgress.init(
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
		current_stage: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
		experience_points: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		health_points: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 100,
		},
		max_health_points: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 100,
		},
		is_completed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		is_unlocked: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		last_watered_at: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		planted_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		completed_at: {
			type: DataTypes.DATE,
			allowNull: true,
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
		tableName: 'user_bio_garden_progress',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		indexes: [
			{
				unique: true,
				fields: ['user_id', 'plant_id'],
			},
		],
	},
);
