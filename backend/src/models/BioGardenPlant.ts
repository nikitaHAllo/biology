// models/BioGardenPlant.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

export interface BioGardenPlantAttributes {
	id: number;
	name: string;
	description: string;
	scientific_name: string;
	image_url: string;
	image_urls: string[];
	growth_stages: number;
	required_experience: number;
	biology_topics: string[];
	difficulty_level: number;
	is_active: boolean;
	created_at?: Date;
	updated_at?: Date;
}

interface BioGardenPlantCreationAttributes extends Optional<
	BioGardenPlantAttributes,
	'id' | 'created_at' | 'updated_at' | 'is_active'
> {}

export class BioGardenPlant
	extends Model<BioGardenPlantAttributes, BioGardenPlantCreationAttributes>
	implements BioGardenPlantAttributes
{
	// Используй declare вместо public
	declare id: number;
	declare name: string;
	declare description: string;
	declare scientific_name: string;
	declare image_url: string;
	declare image_urls: string[];
	declare growth_stages: number;
	declare required_experience: number;
	declare biology_topics: string[];
	declare difficulty_level: number;
	declare is_active: boolean;
	declare readonly created_at?: Date;
	declare readonly updated_at?: Date;

	// Декларации для ассоциаций
	declare readonly questions?: import('./BioGardenQuestion').BioGardenQuestion[];
	declare readonly userProgress?: import('./UserBioGardenProgress').UserBioGardenProgress[];
}

BioGardenPlant.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		scientific_name: {
			type: DataTypes.STRING(200),
			allowNull: false,
		},
		image_url: {
			type: DataTypes.STRING(500),
			allowNull: true,
		},
		image_urls: {
			type: DataTypes.ARRAY(DataTypes.TEXT),
			allowNull: false,
			defaultValue: [],
		},
		growth_stages: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 5,
		},
		required_experience: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		biology_topics: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: false,
			defaultValue: [],
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
		is_active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
	},
	{
		sequelize,
		tableName: 'bio_garden_plants',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	},
);
