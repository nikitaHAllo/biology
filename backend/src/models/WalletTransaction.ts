import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface WalletTransactionAttributes {
	id: number;
	user_id: number;
	type: 'credit' | 'debit';
	amount: number;
	source: string;
	meta: any;
	created_at: Date;
}

interface WalletTransactionCreationAttributes
	extends Optional<WalletTransactionAttributes, 'id' | 'created_at' | 'meta'> {}

export class WalletTransaction
	extends Model<
		WalletTransactionAttributes,
		WalletTransactionCreationAttributes
	>
	implements WalletTransactionAttributes
{
	public id!: number;
	public user_id!: number;
	public type!: 'credit' | 'debit';
	public amount!: number;
	public source!: string;
	public meta!: any;
	public created_at!: Date;
}

WalletTransaction.init(
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
		type: {
			type: DataTypes.ENUM('credit', 'debit'),
			allowNull: false,
		},
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		source: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		meta: {
			type: DataTypes.JSONB,
			allowNull: true,
			defaultValue: {},
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'wallet_transactions',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	}
);
