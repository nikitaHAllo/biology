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
	combo_count: number;
	last_practiced_at: Date | null;
	is_wilted: boolean;
	revive_sleep_until: Date | null;
	last_decay_at: Date | null;
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
	| 'combo_count'
	| 'current_stage'
	| 'experience_points'
	| 'health_points'
	| 'max_health_points'
	| 'last_practiced_at'
	| 'is_wilted'
	| 'revive_sleep_until'
	| 'last_decay_at'
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
	declare id: number;
	declare user_id: number;
	declare plant_id: number;
	declare current_stage: number;
	declare experience_points: number;
	declare health_points: number;
	declare max_health_points: number;
	declare is_completed: boolean;
	declare is_unlocked: boolean;
	declare combo_count: number;
	declare last_practiced_at: Date | null;
	declare is_wilted: boolean;
	declare revive_sleep_until: Date | null;
	declare last_decay_at: Date | null;
	declare last_watered_at: Date | null;
	declare planted_at: Date;
	declare completed_at: Date | null;
	declare created_at: Date;
	declare updated_at: Date;

	// TypeScript declaration for associations
	declare readonly plant?: BioGardenPlant;
	declare readonly user?: import('./User').User;
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
		combo_count: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		last_practiced_at: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		is_wilted: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		revive_sleep_until: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		last_decay_at: {
			type: DataTypes.DATE,
			allowNull: true,
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
