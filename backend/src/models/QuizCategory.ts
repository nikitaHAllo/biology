import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface QuizCategoryAttributes {
    id: number;
    title: string;
    description?: string | null;
    color: string;
    icon?: string | null;
    order_index: number;
    created_at?: Date;
}

interface QuizCategoryCreationAttributes
    extends Optional<QuizCategoryAttributes, 'id' | 'description' | 'color' | 'icon' | 'order_index' | 'created_at'> {}

export class QuizCategory
    extends Model<QuizCategoryAttributes, QuizCategoryCreationAttributes>
    implements QuizCategoryAttributes
{
    public id!: number;
    public title!: string;
    public description?: string | null;
    public color!: string;
    public icon?: string | null;
    public order_index!: number;
    public readonly created_at?: Date;
}

QuizCategory.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        color: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'blue' },
        icon: { type: DataTypes.STRING(100), allowNull: true },
        order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
        sequelize,
        tableName: 'quiz_categories',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    }
);
