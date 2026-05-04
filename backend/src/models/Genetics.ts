import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

// ── GeneticScenario ───────────────────────────────────────────────────────────

export interface GeneticScenarioAttributes {
	id: number;
	title: string;
	description?: string | null;
	difficulty: 'easy' | 'medium' | 'hard';
	coins_reward: number;
	is_active: boolean;
	order_index: number;
	created_at?: Date;
	updated_at?: Date;
}

interface GeneticScenarioCreation
	extends Optional<GeneticScenarioAttributes, 'id' | 'description' | 'difficulty' | 'coins_reward' | 'is_active' | 'order_index' | 'created_at' | 'updated_at'> {}

export class GeneticScenario extends Model<GeneticScenarioAttributes, GeneticScenarioCreation> implements GeneticScenarioAttributes {
	public id!: number;
	public title!: string;
	public description?: string | null;
	public difficulty!: 'easy' | 'medium' | 'hard';
	public coins_reward!: number;
	public is_active!: boolean;
	public order_index!: number;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

GeneticScenario.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		title: { type: DataTypes.STRING, allowNull: false },
		description: { type: DataTypes.TEXT, allowNull: true },
		difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), allowNull: false, defaultValue: 'medium' },
		coins_reward: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
		order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
	},
	{ sequelize, tableName: 'genetic_scenarios', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

// ── GeneticStep ───────────────────────────────────────────────────────────────

export interface GeneticStepAttributes {
	id: number;
	scenario_id: number;
	order_index: number;
	step_type: 'info' | 'question' | 'result';
	title: string;
	content: string;
	points: number;
	explanation?: string | null;
	created_at?: Date;
	updated_at?: Date;
}

interface GeneticStepCreation
	extends Optional<GeneticStepAttributes, 'id' | 'order_index' | 'points' | 'explanation' | 'created_at' | 'updated_at'> {}

export class GeneticStep extends Model<GeneticStepAttributes, GeneticStepCreation> implements GeneticStepAttributes {
	public id!: number;
	public scenario_id!: number;
	public order_index!: number;
	public step_type!: 'info' | 'question' | 'result';
	public title!: string;
	public content!: string;
	public points!: number;
	public explanation?: string | null;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

GeneticStep.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		scenario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: GeneticScenario, key: 'id' } },
		order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		step_type: { type: DataTypes.ENUM('info', 'question', 'result'), allowNull: false },
		title: { type: DataTypes.STRING, allowNull: false },
		content: { type: DataTypes.TEXT, allowNull: false },
		points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		explanation: { type: DataTypes.TEXT, allowNull: true },
	},
	{ sequelize, tableName: 'genetic_steps', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

// ── GeneticOption ─────────────────────────────────────────────────────────────

export interface GeneticOptionAttributes {
	id: number;
	step_id: number;
	option_text: string;
	is_correct: boolean;
	feedback?: string | null;
	order_index: number;
	created_at?: Date;
	updated_at?: Date;
}

interface GeneticOptionCreation
	extends Optional<GeneticOptionAttributes, 'id' | 'is_correct' | 'feedback' | 'order_index' | 'created_at' | 'updated_at'> {}

export class GeneticOption extends Model<GeneticOptionAttributes, GeneticOptionCreation> implements GeneticOptionAttributes {
	public id!: number;
	public step_id!: number;
	public option_text!: string;
	public is_correct!: boolean;
	public feedback?: string | null;
	public order_index!: number;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

GeneticOption.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		step_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: GeneticStep, key: 'id' } },
		option_text: { type: DataTypes.STRING, allowNull: false },
		is_correct: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
		feedback: { type: DataTypes.TEXT, allowNull: true },
		order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
	},
	{ sequelize, tableName: 'genetic_options', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

// ── GeneticResult ─────────────────────────────────────────────────────────────

export interface GeneticResultAttributes {
	id: number;
	user_id: number;
	scenario_id: number;
	score: number;
	coins_earned: number;
	is_completed: boolean;
	completed_at?: Date | null;
	created_at?: Date;
	updated_at?: Date;
}

interface GeneticResultCreation
	extends Optional<GeneticResultAttributes, 'id' | 'score' | 'coins_earned' | 'is_completed' | 'completed_at' | 'created_at' | 'updated_at'> {}

export class GeneticResult extends Model<GeneticResultAttributes, GeneticResultCreation> implements GeneticResultAttributes {
	public id!: number;
	public user_id!: number;
	public scenario_id!: number;
	public score!: number;
	public coins_earned!: number;
	public is_completed!: boolean;
	public completed_at?: Date | null;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

GeneticResult.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		user_id: { type: DataTypes.INTEGER, allowNull: false },
		scenario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: GeneticScenario, key: 'id' } },
		score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		coins_earned: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		is_completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
		completed_at: { type: DataTypes.DATE, allowNull: true },
	},
	{ sequelize, tableName: 'genetic_results', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);
