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
	declare id: number;
	declare telegram_id: number | null;
	declare email: string | null;
	declare password_hash: string | null;
	declare username: string | null;
	declare coins: number;
	declare current_streak?: number;
	declare longest_streak?: number;
	declare last_active_date?: Date | null;
	declare created_at: Date;
	declare email_verified_at?: Date | null;
	declare email_verification_code_hash?: string | null;
	declare email_verification_expires_at?: Date | null;

	// Timestamps
	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;

	// Association methods
	declare getTransactions: HasManyGetAssociationsMixin<WalletTransaction>;
	declare addTransaction: HasManyAddAssociationMixin<WalletTransaction, number>;
	declare hasTransaction: HasManyHasAssociationMixin<WalletTransaction, number>;
	declare countTransactions: HasManyCountAssociationsMixin;
	declare createTransaction: HasManyCreateAssociationMixin<WalletTransaction>;

	declare getProgress: HasManyGetAssociationsMixin<UserProgress>;
	declare addProgress: HasManyAddAssociationMixin<UserProgress, number>;
	declare hasProgress: HasManyHasAssociationMixin<UserProgress, number>;
	declare countProgress: HasManyCountAssociationsMixin;
	declare createProgress: HasManyCreateAssociationMixin<UserProgress>;

	declare getAchievements: HasManyGetAssociationsMixin<UserAchievement>;
	declare addAchievement: HasManyAddAssociationMixin<UserAchievement, number>;
	declare hasAchievement: HasManyHasAssociationMixin<UserAchievement, number>;
	declare countAchievements: HasManyCountAssociationsMixin;
	declare createAchievement: HasManyCreateAssociationMixin<UserAchievement>;

	declare getQuizResults: HasManyGetAssociationsMixin<UserQuizResult>;
	declare getSubmissions: HasManyGetAssociationsMixin<AssignmentSubmission>;

	// Association properties
	declare readonly transactions?: WalletTransaction[];
	declare readonly progress?: UserProgress[];
	declare readonly achievements?: UserAchievement[];
	declare readonly quizResults?: UserQuizResult[];
	declare readonly submissions?: AssignmentSubmission[];

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
