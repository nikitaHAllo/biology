import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface AssignmentSubmissionAttributes {
	id: number;
	assignment_id: number;
	user_id: number;
	file_id: string;
	file_type: string;
	status: 'pending' | 'reviewing' | 'graded' | 'rejected';
	created_at: Date;
}

interface AssignmentSubmissionCreationAttributes
	extends Optional<
		AssignmentSubmissionAttributes,
		'id' | 'status' | 'created_at'
	> {}

export class AssignmentSubmission
	extends Model<
		AssignmentSubmissionAttributes,
		AssignmentSubmissionCreationAttributes
	>
	implements AssignmentSubmissionAttributes
{
	public id!: number;
	public assignment_id!: number;
	public user_id!: number;
	public file_id!: string;
	public file_type!: string;
	public status!: 'pending' | 'reviewing' | 'graded' | 'rejected';
	public created_at!: Date;
}

AssignmentSubmission.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		assignment_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'assignments',
				key: 'id',
			},
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id',
			},
		},
		file_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		file_type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM('pending', 'reviewing', 'graded', 'rejected'),
			allowNull: false,
			defaultValue: 'pending',
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'assignment_submissions',
		underscored: true,
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	}
);
