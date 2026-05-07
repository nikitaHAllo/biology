import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

export interface QuizAttributes {
	id: number;
	title: string;
	description?: string | null;
	total_questions: number;
	total_points: number;
	estimated_minutes?: number | null;
	is_active: boolean;
	coins_reward: number;
	difficulty: 'easy' | 'medium' | 'hard';
	topic_tag?: string | null;
	category_id: number;
	created_at?: Date;
	updated_at?: Date;
}

interface QuizCreationAttributes
	extends Optional<
		QuizAttributes,
		'id' | 'description' | 'total_questions' | 'total_points' | 'estimated_minutes' | 'is_active' | 'coins_reward' | 'difficulty' | 'topic_tag' | 'category_id' | 'created_at' | 'updated_at'
	> {}

export class Quiz
	extends Model<QuizAttributes, QuizCreationAttributes>
	implements QuizAttributes
{
	public id!: number;
	public title!: string;
	public description?: string | null;
	public total_questions!: number;
	public total_points!: number;
	public estimated_minutes?: number | null;
	public is_active!: boolean;
	public coins_reward!: number;
	public difficulty!: 'easy' | 'medium' | 'hard';
	public topic_tag?: string | null;
	public category_id!: number;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

Quiz.init(
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
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		total_questions: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		total_points: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		estimated_minutes: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		coins_reward: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		difficulty: {
			type: DataTypes.ENUM('easy', 'medium', 'hard'),
			allowNull: false,
			defaultValue: 'medium',
		},
		topic_tag: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		category_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
			references: { model: 'quiz_categories', key: 'id' },
		},
	},
	{
		sequelize,
		tableName: 'quizzes',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);

export interface QuizQuestionAttributes {
	id: number;
	quiz_id: number;
	question_text: string;
	question_type: 'single_choice' | 'multiple_choice' | 'true_false';
	order_index: number;
	points: number;
	timer_seconds?: number | null;
	explanation?: string | null;
	created_at?: Date;
	updated_at?: Date;
}

interface QuizQuestionCreationAttributes
	extends Optional<
		QuizQuestionAttributes,
		'id' | 'order_index' | 'points' | 'timer_seconds' | 'explanation' | 'created_at' | 'updated_at'
	> {}

export class QuizQuestion
	extends Model<QuizQuestionAttributes, QuizQuestionCreationAttributes>
	implements QuizQuestionAttributes
{
	public id!: number;
	public quiz_id!: number;
	public question_text!: string;
	public question_type!: 'single_choice' | 'multiple_choice' | 'true_false';
	public order_index!: number;
	public points!: number;
	public timer_seconds?: number | null;
	public explanation?: string | null;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

QuizQuestion.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		quiz_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: Quiz,
				key: 'id',
			},
		},
		question_text: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		question_type: {
			type: DataTypes.ENUM('single_choice', 'multiple_choice', 'true_false'),
			allowNull: false,
		},
		order_index: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		points: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
		timer_seconds: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		explanation: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
	},
	{
		sequelize,
		tableName: 'quiz_questions',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);

export interface QuizOptionAttributes {
	id: number;
	question_id: number;
	option_text: string;
	is_correct: boolean;
	order_index: number;
	created_at?: Date;
	updated_at?: Date;
}

interface QuizOptionCreationAttributes
	extends Optional<QuizOptionAttributes, 'id' | 'is_correct' | 'order_index' | 'created_at' | 'updated_at'> {}

export class QuizOption
	extends Model<QuizOptionAttributes, QuizOptionCreationAttributes>
	implements QuizOptionAttributes
{
	public id!: number;
	public question_id!: number;
	public option_text!: string;
	public is_correct!: boolean;
	public order_index!: number;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

QuizOption.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		question_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: QuizQuestion,
				key: 'id',
			},
		},
		option_text: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		is_correct: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		order_index: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		sequelize,
		tableName: 'quiz_options',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);


