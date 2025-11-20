import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface AssignmentReviewAttributes {
	id: number;
	submission_id: number;
	reviewer_id: number | null;
	score: number | null;
	comment: string | null;
	checklist: Record<string, unknown> | null; // JSONB
	created_at: Date;
}

interface AssignmentReviewCreationAttributes
	extends Optional<AssignmentReviewAttributes, 'id' | 'created_at'> {}

export class AssignmentReview
	extends Model<AssignmentReviewAttributes, AssignmentReviewCreationAttributes>
	implements AssignmentReviewAttributes
{
	public id!: number;
	public submission_id!: number;
	public reviewer_id!: number | null;
	public score!: number | null;
	public comment!: string | null;
	public checklist!: Record<string, unknown> | null;
	public created_at!: Date;
}

AssignmentReview.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		submission_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'assignment_submissions',
				key: 'id',
			},
		},
		reviewer_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'users',
				key: 'id',
			},
		},
		score: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 0,
				max: 100,
			},
		},
		comment: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		checklist: {
			type: DataTypes.JSONB,
			allowNull: true,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'assignment_reviews',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	}
);
