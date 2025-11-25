import { sequelize } from '../db/sequelize';
import { User } from './User';
import { WalletTransaction } from './WalletTransaction';
import { Course } from './Course';
import { Lesson } from './Lesson';
import { Task } from './Task';
import { UserTaskResult } from './UserTaskResult';
import { UserProgress } from './UserProgress';
import { Achievement } from './Achievement';
import { UserAchievement } from './UserAchievement';
import { Assignment } from './Assignment';
import { AssignmentSubmission } from './AssignmentSubmission';
import { AssignmentReview } from './AssignmentReview';
import {
	MaterialSection,
	MaterialTopic,
	MaterialFile,
} from './Material';
import { Quiz, QuizQuestion, QuizOption } from './Quiz';
import {
	DownloadableTask,
	TaskCollection,
	TaskCollectionItem,
} from './DownloadableTask';
import { UserMaterialAccess } from './UserMaterialAccess';

// Определение связей - ВАЖНО: правильный порядок и настройки
User.hasMany(WalletTransaction, { foreignKey: 'user_id', as: 'transactions' });
WalletTransaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(UserTaskResult, { foreignKey: 'user_id', as: 'taskResults' });
UserTaskResult.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserTaskResult.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

// ВАЖНО: Связь UserProgress с User и Lesson
User.hasMany(UserProgress, { foreignKey: 'user_id', as: 'progress' });
UserProgress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserProgress.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' }); // Добавь эту строку

User.hasMany(UserAchievement, { foreignKey: 'user_id', as: 'achievements' });
UserAchievement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserAchievement.belongsTo(Achievement, {
	foreignKey: 'achievement_id',
	as: 'achievement',
});

User.hasMany(AssignmentSubmission, {
	foreignKey: 'user_id',
	as: 'submissions',
});
AssignmentSubmission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AssignmentReview, { foreignKey: 'reviewer_id', as: 'reviews' });
AssignmentReview.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });

Course.hasMany(Lesson, { foreignKey: 'course_id', as: 'lessons' });
Lesson.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Lesson.hasMany(Task, { foreignKey: 'lesson_id', as: 'tasks' });
Task.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

Lesson.hasMany(Assignment, { foreignKey: 'lesson_id', as: 'assignments' });
Assignment.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

Task.hasMany(UserTaskResult, { foreignKey: 'task_id', as: 'userResults' });

Achievement.hasMany(UserAchievement, {
	foreignKey: 'achievement_id',
	as: 'userAchievements',
});

Assignment.hasMany(AssignmentSubmission, {
	foreignKey: 'assignment_id',
	as: 'submissions',
});
AssignmentSubmission.belongsTo(Assignment, {
	foreignKey: 'assignment_id',
	as: 'assignment',
});

AssignmentSubmission.hasMany(AssignmentReview, {
	foreignKey: 'submission_id',
	as: 'reviews',
});
AssignmentReview.belongsTo(AssignmentSubmission, {
	foreignKey: 'submission_id',
	as: 'submission',
});

MaterialSection.hasMany(MaterialTopic, {
	foreignKey: 'section_id',
	as: 'topics',
});
MaterialTopic.belongsTo(MaterialSection, {
	foreignKey: 'section_id',
	as: 'section',
});

MaterialTopic.hasMany(MaterialFile, {
	foreignKey: 'topic_id',
	as: 'files',
});
MaterialFile.belongsTo(MaterialTopic, {
	foreignKey: 'topic_id',
	as: 'topic',
});

User.hasMany(UserMaterialAccess, {
	foreignKey: 'user_id',
	as: 'materialAccesses',
});
UserMaterialAccess.belongsTo(User, {
	foreignKey: 'user_id',
	as: 'user',
});
MaterialTopic.hasMany(UserMaterialAccess, {
	foreignKey: 'topic_id',
	as: 'accesses',
});
UserMaterialAccess.belongsTo(MaterialTopic, {
	foreignKey: 'topic_id',
	as: 'topic',
});

Quiz.hasMany(QuizQuestion, { foreignKey: 'quiz_id', as: 'questions' });
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

QuizQuestion.hasMany(QuizOption, {
	foreignKey: 'question_id',
	as: 'options',
});
QuizOption.belongsTo(QuizQuestion, {
	foreignKey: 'question_id',
	as: 'question',
});

TaskCollection.belongsToMany(DownloadableTask, {
	through: TaskCollectionItem,
	foreignKey: 'collection_id',
	otherKey: 'task_id',
	as: 'tasks',
});
DownloadableTask.belongsToMany(TaskCollection, {
	through: TaskCollectionItem,
	foreignKey: 'task_id',
	otherKey: 'collection_id',
	as: 'collections',
});

TaskCollection.hasMany(TaskCollectionItem, {
	foreignKey: 'collection_id',
	as: 'items',
});
TaskCollectionItem.belongsTo(TaskCollection, {
	foreignKey: 'collection_id',
	as: 'collection',
});
TaskCollectionItem.belongsTo(DownloadableTask, {
	foreignKey: 'task_id',
	as: 'task',
});

export {
	User,
	WalletTransaction,
	Course,
	Lesson,
	Task,
	UserTaskResult,
	UserProgress,
	Achievement,
	UserAchievement,
	Assignment,
	AssignmentSubmission,
	AssignmentReview,
	MaterialSection,
	MaterialTopic,
	MaterialFile,
	Quiz,
	QuizQuestion,
	QuizOption,
	DownloadableTask,
	TaskCollection,
	TaskCollectionItem,
	UserMaterialAccess,
	sequelize,
};
