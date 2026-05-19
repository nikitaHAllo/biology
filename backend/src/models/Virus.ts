import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

// ── VirusCase ─────────────────────────────────────────────────────────────────

export interface VirusCaseAttributes {
	id: number;
	title: string;
	description?: string | null;
	patient_info?: string | null;
	role_description?: string | null;
	success_text?: string | null;
	failure_text?: string | null;
	difficulty: 'easy' | 'medium' | 'hard';
	coins_reward: number;
	order_index: number;
	is_active: boolean;
	created_at?: Date;
	updated_at?: Date;
}

interface VirusCaseCreation
	extends Optional<VirusCaseAttributes, 'id' | 'description' | 'patient_info' | 'role_description' | 'success_text' | 'failure_text' | 'difficulty' | 'coins_reward' | 'order_index' | 'is_active' | 'created_at' | 'updated_at'> {}

export class VirusCase extends Model<VirusCaseAttributes, VirusCaseCreation> implements VirusCaseAttributes {
	public id!: number;
	public title!: string;
	public description?: string | null;
	public patient_info?: string | null;
	public role_description?: string | null;
	public success_text?: string | null;
	public failure_text?: string | null;
	public difficulty!: 'easy' | 'medium' | 'hard';
	public coins_reward!: number;
	public order_index!: number;
	public is_active!: boolean;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

VirusCase.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		title: { type: DataTypes.STRING, allowNull: false },
		description: { type: DataTypes.TEXT, allowNull: true },
		patient_info: { type: DataTypes.TEXT, allowNull: true },
		role_description: { type: DataTypes.TEXT, allowNull: true },
		success_text: { type: DataTypes.TEXT, allowNull: true },
		failure_text: { type: DataTypes.TEXT, allowNull: true },
		difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), allowNull: false, defaultValue: 'medium' },
		coins_reward: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
	},
	{ sequelize, tableName: 'virus_cases', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

// ── VirusClue ─────────────────────────────────────────────────────────────────

export interface VirusClueAttributes {
	id: number;
	case_id: number;
	order_index: number;
	clue_text: string;
	clue_type: 'symptom' | 'lab' | 'observation';
	created_at?: Date;
	updated_at?: Date;
}

interface VirusClueCreation
	extends Optional<VirusClueAttributes, 'id' | 'order_index' | 'clue_type' | 'created_at' | 'updated_at'> {}

export class VirusClue extends Model<VirusClueAttributes, VirusClueCreation> implements VirusClueAttributes {
	public id!: number;
	public case_id!: number;
	public order_index!: number;
	public clue_text!: string;
	public clue_type!: 'symptom' | 'lab' | 'observation';
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

VirusClue.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		case_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: VirusCase, key: 'id' } },
		order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		clue_text: { type: DataTypes.TEXT, allowNull: false },
		clue_type: { type: DataTypes.ENUM('symptom', 'lab', 'observation'), allowNull: false, defaultValue: 'symptom' },
	},
	{ sequelize, tableName: 'virus_clues', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

// ── VirusSuspect ──────────────────────────────────────────────────────────────

export interface VirusSuspectAttributes {
	id: number;
	case_id: number;
	name: string;
	description?: string | null;
	is_correct: boolean;
	order_index: number;
	created_at?: Date;
	updated_at?: Date;
}

interface VirusSuspectCreation
	extends Optional<VirusSuspectAttributes, 'id' | 'description' | 'is_correct' | 'order_index' | 'created_at' | 'updated_at'> {}

export class VirusSuspect extends Model<VirusSuspectAttributes, VirusSuspectCreation> implements VirusSuspectAttributes {
	public id!: number;
	public case_id!: number;
	public name!: string;
	public description?: string | null;
	public is_correct!: boolean;
	public order_index!: number;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

VirusSuspect.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		case_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: VirusCase, key: 'id' } },
		name: { type: DataTypes.STRING, allowNull: false },
		description: { type: DataTypes.TEXT, allowNull: true },
		is_correct: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
		order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
	},
	{ sequelize, tableName: 'virus_suspects', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

// ── VirusResult ───────────────────────────────────────────────────────────────

export interface VirusResultAttributes {
	id: number;
	user_id: number;
	case_id: number;
	score: number;
	clues_used: number;
	correct_answers: number;
	coins_earned: number;
	is_completed: boolean;
	completed_at?: Date | null;
	created_at?: Date;
	updated_at?: Date;
}

interface VirusResultCreation
	extends Optional<VirusResultAttributes, 'id' | 'score' | 'clues_used' | 'correct_answers' | 'coins_earned' | 'is_completed' | 'completed_at' | 'created_at' | 'updated_at'> {}

export class VirusResult extends Model<VirusResultAttributes, VirusResultCreation> implements VirusResultAttributes {
	public id!: number;
	public user_id!: number;
	public case_id!: number;
	public score!: number;
	public clues_used!: number;
	public correct_answers!: number;
	public coins_earned!: number;
	public is_completed!: boolean;
	public completed_at?: Date | null;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

VirusResult.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		user_id: { type: DataTypes.INTEGER, allowNull: false },
		case_id: { type: DataTypes.INTEGER, allowNull: false },
		score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		clues_used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		correct_answers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		coins_earned: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		is_completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
		completed_at: { type: DataTypes.DATE, allowNull: true },
	},
	{ sequelize, tableName: 'virus_results', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

// ── VirusChapter ──────────────────────────────────────────────────────────────

export interface VirusChapterAttributes {
	id: number;
	case_id: number;
	order_index: number;
	title: string;
	narrative_text: string;
	question_text: string;
	created_at?: Date;
	updated_at?: Date;
}

interface VirusChapterCreation
	extends Optional<VirusChapterAttributes, 'id' | 'order_index' | 'created_at' | 'updated_at'> {}

export class VirusChapter extends Model<VirusChapterAttributes, VirusChapterCreation> implements VirusChapterAttributes {
	public id!: number;
	public case_id!: number;
	public order_index!: number;
	public title!: string;
	public narrative_text!: string;
	public question_text!: string;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

VirusChapter.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		case_id: { type: DataTypes.INTEGER, allowNull: false },
		order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		title: { type: DataTypes.STRING, allowNull: false },
		narrative_text: { type: DataTypes.TEXT, allowNull: false },
		question_text: { type: DataTypes.TEXT, allowNull: false },
	},
	{ sequelize, tableName: 'virus_chapters', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

// ── VirusChapterOption ────────────────────────────────────────────────────────

export interface VirusChapterOptionAttributes {
	id: number;
	chapter_id: number;
	order_index: number;
	text: string;
	is_correct: boolean;
	consequence_text: string;
	created_at?: Date;
	updated_at?: Date;
}

interface VirusChapterOptionCreation
	extends Optional<VirusChapterOptionAttributes, 'id' | 'order_index' | 'is_correct' | 'created_at' | 'updated_at'> {}

export class VirusChapterOption extends Model<VirusChapterOptionAttributes, VirusChapterOptionCreation> implements VirusChapterOptionAttributes {
	public id!: number;
	public chapter_id!: number;
	public order_index!: number;
	public text!: string;
	public is_correct!: boolean;
	public consequence_text!: string;
	public readonly created_at?: Date;
	public readonly updated_at?: Date;
}

VirusChapterOption.init(
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		chapter_id: { type: DataTypes.INTEGER, allowNull: false },
		order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		text: { type: DataTypes.STRING, allowNull: false },
		is_correct: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
		consequence_text: { type: DataTypes.TEXT, allowNull: false },
	},
	{ sequelize, tableName: 'virus_chapter_options', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);
