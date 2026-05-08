import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

export interface DownloadableTaskAttributes {
	id: number;
	title: string;
	source: 'ege' | 'fipi' | 'other';
	description?: string | null;
	file_url: string;
	file_type: 'word' | 'pdf' | 'zip' | 'other';
	file_size?: number | null;
	year?: number | null;
	subject?: string | null;
	created_at?: Date;
	updated_at?: Date;
}

interface DownloadableTaskCreationAttributes
	extends Optional<
		DownloadableTaskAttributes,
		'id' | 'description' | 'file_size' | 'year' | 'subject' | 'created_at' | 'updated_at'
	> {}

export class DownloadableTask
	extends Model<DownloadableTaskAttributes, DownloadableTaskCreationAttributes>
	implements DownloadableTaskAttributes
{
	public id!: number;
	public title!: string;
	public source!: 'ege' | 'fipi' | 'other';
	public description?: string | null;
	public file_url!: string;
	public file_type!: 'word' | 'pdf' | 'zip' | 'other';
	public file_size?: number | null;
	public year?: number | null;
	public subject?: string | null;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

DownloadableTask.init(
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
		source: {
			type: DataTypes.ENUM('ege', 'fipi', 'other'),
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
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
		year: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		subject: {
			type: DataTypes.STRING,
			allowNull: true,
		},
	},
	{
		sequelize,
		tableName: 'downloadable_tasks',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);

export interface TaskCollectionAttributes {
	id: number;
	title: string;
	source: 'ege' | 'fipi' | 'other';
	description?: string | null;
	download_url?: string | null;
	total_size?: number | null;
	created_at?: Date;
	updated_at?: Date;
}

interface TaskCollectionCreationAttributes
	extends Optional<TaskCollectionAttributes, 'id' | 'description' | 'download_url' | 'total_size' | 'created_at' | 'updated_at'> {}

export class TaskCollection
	extends Model<TaskCollectionAttributes, TaskCollectionCreationAttributes>
	implements TaskCollectionAttributes
{
	public id!: number;
	public title!: string;
	public source!: 'ege' | 'fipi' | 'other';
	public description?: string | null;
	public download_url?: string | null;
	public total_size?: number | null;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

TaskCollection.init(
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
		source: {
			type: DataTypes.ENUM('ege', 'fipi', 'other'),
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		download_url: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		total_size: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
		},
	},
	{
		sequelize,
		tableName: 'task_collections',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);

export interface TaskCollectionItemAttributes {
	id: number;
	collection_id: number;
	task_id: number;
	order_index: number;
	created_at?: Date;
	updated_at?: Date;
}

interface TaskCollectionItemCreationAttributes
	extends Optional<TaskCollectionItemAttributes, 'id' | 'order_index' | 'created_at' | 'updated_at'> {}

export class TaskCollectionItem
	extends Model<TaskCollectionItemAttributes, TaskCollectionItemCreationAttributes>
	implements TaskCollectionItemAttributes
{
	public id!: number;
	public collection_id!: number;
	public task_id!: number;
	public order_index!: number;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

TaskCollectionItem.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		collection_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: TaskCollection,
				key: 'id',
			},
		},
		task_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: DownloadableTask,
				key: 'id',
			},
		},
		order_index: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		sequelize,
		tableName: 'task_collection_items',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);


