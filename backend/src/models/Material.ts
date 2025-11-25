import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

export interface MaterialSectionAttributes {
	id: number;
	title: string;
	slug: string;
	description?: string | null;
	icon?: string | null;
	order_index: number;
	created_at?: Date;
	updated_at?: Date;
}

interface MaterialSectionCreationAttributes
	extends Optional<
		MaterialSectionAttributes,
		'id' | 'description' | 'icon' | 'order_index' | 'created_at' | 'updated_at'
	> {}

export class MaterialSection
	extends Model<MaterialSectionAttributes, MaterialSectionCreationAttributes>
	implements MaterialSectionAttributes
{
	public id!: number;
	public title!: string;
	public slug!: string;
	public description?: string | null;
	public icon?: string | null;
	public order_index!: number;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

MaterialSection.init(
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
		slug: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		icon: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		order_index: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		sequelize,
		tableName: 'material_sections',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);

export interface MaterialTopicAttributes {
	id: number;
	section_id: number;
	title: string;
	slug: string;
	description?: string | null;
	price_repcoins: number;
	order_index: number;
	is_default_unlocked: boolean;
	created_at?: Date;
	updated_at?: Date;
}

interface MaterialTopicCreationAttributes
	extends Optional<
		MaterialTopicAttributes,
		'id' | 'description' | 'order_index' | 'is_default_unlocked' | 'created_at' | 'updated_at'
	> {}

export class MaterialTopic
	extends Model<MaterialTopicAttributes, MaterialTopicCreationAttributes>
	implements MaterialTopicAttributes
{
	public id!: number;
	public section_id!: number;
	public title!: string;
	public slug!: string;
	public description?: string | null;
	public price_repcoins!: number;
	public order_index!: number;
	public is_default_unlocked!: boolean;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

MaterialTopic.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		section_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: MaterialSection,
				key: 'id',
			},
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		slug: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		price_repcoins: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		order_index: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		is_default_unlocked: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
	},
	{
		sequelize,
		tableName: 'material_topics',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);

export interface MaterialFileAttributes {
	id: number;
	topic_id: number;
	name: string;
	file_url: string;
	file_type: 'word' | 'pdf' | 'zip' | 'other';
	file_size?: number | null;
	created_at?: Date;
	updated_at?: Date;
}

interface MaterialFileCreationAttributes
	extends Optional<MaterialFileAttributes, 'id' | 'file_size' | 'created_at' | 'updated_at'> {}

export class MaterialFile
	extends Model<MaterialFileAttributes, MaterialFileCreationAttributes>
	implements MaterialFileAttributes
{
	public id!: number;
	public topic_id!: number;
	public name!: string;
	public file_url!: string;
	public file_type!: 'word' | 'pdf' | 'zip' | 'other';
	public file_size?: number | null;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

MaterialFile.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		topic_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: MaterialTopic,
				key: 'id',
			},
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		file_url: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		file_type: {
			type: DataTypes.ENUM('word', 'pdf', 'zip', 'other'),
			allowNull: false,
			defaultValue: 'pdf',
		},
		file_size: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
		},
	},
	{
		sequelize,
		tableName: 'material_files',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);


