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
import { UserQuizResult } from './UserQuizResult';
import { AssignmentSubmission } from './AssignmentSubmission';

interface UserAttributes {
	id: number;
	telegram_id: number | null;
	email: string | null;
	password_hash: string | null;
	username: string | null;
	coins: number;
	current_streak?: number;
	longest_streak?: number;
	last_active_date?: Date | null;
	created_at: Date;
	email_verified_at?: Date | null;
	email_verification_code_hash?: string | null;
	email_verification_expires_at?: Date | null;
}

interface UserCreationAttributes
	extends Optional<
		UserAttributes,
		| 'id'
		| 'telegram_id'
		| 'username'
		| 'email'
		| 'password_hash'
		| 'coins'
		| 'created_at'
		| 'current_streak'
		| 'longest_streak'
		| 'last_active_date'
		| 'email_verified_at'
		| 'email_verification_code_hash'
		| 'email_verification_expires_at'
	> {}

export class User
	extends Model<UserAttributes, UserCreationAttributes>
	implements UserAttributes
{
	public id!: number;
	public telegram_id!: number | null;
	public email!: string | null;
	public password_hash!: string | null;
	public username!: string | null;
	public coins!: number;
	public current_streak?: number;
	public longest_streak?: number;
	public last_active_date?: Date | null;
	public created_at!: Date;
	public email_verified_at?: Date | null;
	public email_verification_code_hash?: string | null;
	public email_verification_expires_at?: Date | null;

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

	public getQuizResults!: HasManyGetAssociationsMixin<UserQuizResult>;
	public getSubmissions!: HasManyGetAssociationsMixin<AssignmentSubmission>;

	// Association properties
	public readonly transactions?: WalletTransaction[];
	public readonly progress?: UserProgress[];
	public readonly achievements?: UserAchievement[];
	public readonly quizResults?: UserQuizResult[];
	public readonly submissions?: AssignmentSubmission[];

	// Static associations
	public static associations: {
		transactions: Association<User, WalletTransaction>;
		progress: Association<User, UserProgress>;
		achievements: Association<User, UserAchievement>;
		quizResults: Association<User, UserQuizResult>;
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
			allowNull: true,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		password_hash: {
			type: DataTypes.TEXT,
			allowNull: true,
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
		current_streak: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		longest_streak: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		last_active_date: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		email_verified_at: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		email_verification_code_hash: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		email_verification_expires_at: {
			type: DataTypes.DATE,
			allowNull: true,
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
