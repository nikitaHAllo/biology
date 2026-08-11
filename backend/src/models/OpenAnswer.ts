import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { User } from './User';
import { QuizQuestion } from './Quiz';

export type ReviewStatus = 'not_requested' | 'pending' | 'reviewed';

export interface OpenAnswerAttributes {
	id: number;
	user_id: number;
	question_id: number;
	quiz_id: number;
	answer_text: string;
	review_status: ReviewStatus;
	teacher_comment: string | null;
	score: number | null;
	repcoins_spent: number;
	submitted_at: Date;
	reviewed_at: Date | null;
}

interface OpenAnswerCreationAttributes
	extends Optional<OpenAnswerAttributes, 'id' | 'review_status' | 'teacher_comment' | 'score' | 'repcoins_spent' | 'submitted_at' | 'reviewed_at'> {}

export class OpenAnswer
	extends Model<OpenAnswerAttributes, OpenAnswerCreationAttributes>
	implements OpenAnswerAttributes
{
	public id!: number;
	public user_id!: number;
	public question_id!: number;
	public quiz_id!: number;
	public answer_text!: string;
	public review_status!: ReviewStatus;
	public teacher_comment!: string | null;
	public score!: number | null;
	public repcoins_spent!: number;
	public submitted_at!: Date;
	public reviewed_at!: Date | null;
}

OpenAnswer.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: { model: User, key: 'id' },
		},
		question_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: { model: QuizQuestion, key: 'id' },
		},
		quiz_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		answer_text: { type: DataTypes.TEXT, allowNull: false },
		review_status: {
			type: DataTypes.ENUM('not_requested', 'pending', 'reviewed'),
			allowNull: false,
			defaultValue: 'not_requested',
		},
		teacher_comment: { type: DataTypes.TEXT, allowNull: true },
		score: { type: DataTypes.INTEGER, allowNull: true },
		repcoins_spent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
		reviewed_at: { type: DataTypes.DATE, allowNull: true },
	},
	{
		sequelize,
		tableName: 'open_answers',
		underscored: true,
		timestamps: false,
		indexes: [
			{ unique: true, fields: ['user_id', 'question_id'] },
		],
	}
);
