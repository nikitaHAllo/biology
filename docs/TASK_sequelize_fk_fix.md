# Задача: Исправление ошибки Sequelize alter + FK + DEFAULT

## Проблема

При запуске бэкенда с `sequelize.sync({ alter: true })` падала ошибка:

```
syntax error at or near "REFERENCES"
ALTER TABLE "quizzes" ALTER COLUMN "category_id" SET DEFAULT 1 REFERENCES "quiz_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

PostgreSQL не позволяет указывать `REFERENCES` внутри `ALTER COLUMN SET DEFAULT` — это невалидный синтаксис. Sequelize генерирует такой SQL когда колонка одновременно имеет `defaultValue` и FK-ссылку, и таблица уже существует в БД (т.е. запускается `ALTER`, а не `CREATE`).

## Причина

Два источника FK-информации в Sequelize при `alter: true`:
1. `references` в определении колонки (`Quiz.ts`)
2. `belongsTo` / `hasMany` ассоциации (`index.ts`)

Оба источника заставляют Sequelize пытаться добавить FK-constraint через `ALTER COLUMN`, но PostgreSQL требует отдельного `ADD CONSTRAINT` — встроить `REFERENCES` в `SET DEFAULT` нельзя.

## Что изменено

### `backend/src/models/Quiz.ts`

Удалён `references` из определения колонки `category_id`:
```typescript
// было:
category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    references: { model: 'quiz_categories', key: 'id' },
}
// стало:
category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
}
```

### `backend/src/models/index.ts`

Добавлен `constraints: false` на ассоциации `QuizCategory ↔ Quiz`:
```typescript
QuizCategory.hasMany(Quiz, { foreignKey: 'category_id', as: 'quizzes', constraints: false });
Quiz.belongsTo(QuizCategory, { foreignKey: 'category_id', as: 'category', constraints: false });
```

`constraints: false` говорит Sequelize не создавать FK-constraint на уровне БД при `sync`. Ассоциации для `include: [QuizCategory as 'category']` в запросах продолжают работать корректно.

## Правило на будущее

При `sequelize.sync({ alter: true })` нельзя совмещать `defaultValue` + `references` в одном определении колонки — Sequelize генерирует невалидный SQL для PostgreSQL. Используй `constraints: false` на ассоциациях или убирай `references` из колонки (FK всё равно создаётся через ассоциацию при `CREATE TABLE`).
