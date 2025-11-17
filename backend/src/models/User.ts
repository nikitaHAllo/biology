import {
	DataTypes,
	Model,
	Optional,
	HasManyGetAssociationsMixin,
	HasManyAddAssociationMixin,
	HasManyHasAssociationMixin,
	HasManyCountAssociationsMixin,
	HasManyCreateAssociationMixin,
	Association,
} from 'sequelize';
import { sequelize } from '../db/sequelize';
import { WalletTransaction } from './WalletTransaction';
import { UserProgress } from './UserProgress';
import { UserAchievement } from './UserAchievement';
import { UserTaskResult } from './UserTaskResult';
import { AssignmentSubmission } from './AssignmentSubmission';

interface UserAttributes {
	id: number;
	telegram_id: number;
	username: string | null;
	coins: number;
	created_at: Date;
}

interface UserCreationAttributes
	extends Optional<
		UserAttributes,
		'id' | 'username' | 'coins' | 'created_at'
	> {}

export class User
	extends Model<UserAttributes, UserCreationAttributes>
	implements UserAttributes
{
	public id!: number;
	public telegram_id!: number;
	public username!: string | null;
	public coins!: number;
	public created_at!: Date;

	// Timestamps
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;

	// Association methods
	public getTransactions!: HasManyGetAssociationsMixin<WalletTransaction>;
	public addTransaction!: HasManyAddAssociationMixin<WalletTransaction, number>;
	public hasTransaction!: HasManyHasAssociationMixin<WalletTransaction, number>;
	public countTransactions!: HasManyCountAssociationsMixin;
	public createTransaction!: HasManyCreateAssociationMixin<WalletTransaction>;

	public getProgress!: HasManyGetAssociationsMixin<UserProgress>;
	public addProgress!: HasManyAddAssociationMixin<UserProgress, number>;
	public hasProgress!: HasManyHasAssociationMixin<UserProgress, number>;
	public countProgress!: HasManyCountAssociationsMixin;
	public createProgress!: HasManyCreateAssociationMixin<UserProgress>;

	public getAchievements!: HasManyGetAssociationsMixin<UserAchievement>;
	public addAchievement!: HasManyAddAssociationMixin<UserAchievement, number>;
	public hasAchievement!: HasManyHasAssociationMixin<UserAchievement, number>;
	public countAchievements!: HasManyCountAssociationsMixin;
	public createAchievement!: HasManyCreateAssociationMixin<UserAchievement>;

	public getTaskResults!: HasManyGetAssociationsMixin<UserTaskResult>;
	public getSubmissions!: HasManyGetAssociationsMixin<AssignmentSubmission>;

	// Association properties
	public readonly transactions?: WalletTransaction[];
	public readonly progress?: UserProgress[];
	public readonly achievements?: UserAchievement[];
	public readonly taskResults?: UserTaskResult[];
	public readonly submissions?: AssignmentSubmission[];

	// Static associations
	public static associations: {
		transactions: Association<User, WalletTransaction>;
		progress: Association<User, UserProgress>;
		achievements: Association<User, UserAchievement>;
		taskResults: Association<User, UserTaskResult>;
		submissions: Association<User, AssignmentSubmission>;
	};
}

User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		telegram_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			unique: true,
		},
		username: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		coins: {
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
		tableName: 'users',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	}
);
