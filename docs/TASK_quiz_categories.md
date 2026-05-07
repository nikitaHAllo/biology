# Задача: Категории квизов и логика повторного прохождения

## Что сделано

### 1. Категории квизов

Добавлена таблица `quiz_categories` и привязка тестов к категориям. Студент видит кнопки-фильтры «Все темы / Цитология / Генетика / ...» и может фильтровать тесты по теме.

### 2. Правила прохождения

| Результат | Монеты | Вкладка «Пройденные» |
|---|---|---|
| Не все ответы верны | 0 | Нет, остаётся в «Новые» |
| Все ответы верны (100%) | `coins_reward` | Да, переходит в «Пройденные» |
| Перепрохождение уже пройденного | 0 | — |

---

## Изменения в БД

Новая таблица `quiz_categories`:
```
id, title, description, color (varchar 50), icon (varchar 100), order_index, created_at
```

Новая колонка `quizzes.category_id INTEGER NOT NULL DEFAULT 1` → FK на `quiz_categories.id`

**Нужно дропнуть БД** перед запуском — таблица пересоздаётся через `sequelize.sync({ alter: true })`.

---

## Backend

### `backend/src/models/QuizCategory.ts` (новый файл)
Sequelize-модель для `quiz_categories`.

### `backend/src/models/Quiz.ts`
Добавлен `category_id: number` с `defaultValue: 1` и FK-ссылкой.

### `backend/src/models/index.ts`
Импорт, ассоциации `QuizCategory.hasMany(Quiz)` и `Quiz.belongsTo(QuizCategory)`, экспорт.

### `backend/src/api/controllers/quizzes.controller.ts`

- `list()`: включает категорию через join (`include: [QuizCategory as 'category']`); `is_completed: !!result?.is_passed` — только 100% = пройден
- `complete()`: монеты начисляются только при `isPassed = true`; `UserProgress.status = isPassed ? 'completed' : 'pending'`
- Новый метод `getCategories()` → `GET /quizzes/categories`

### `backend/src/api/routes/quizzes.routes.ts`
Добавлен `GET /categories`.

### `backend/src/api/controllers/admin.controller.ts`
- `createQuiz` / `updateQuiz` принимают `category_id`
- Новые методы: `getQuizCategories`, `createQuizCategory`, `updateQuizCategory`, `deleteQuizCategory`

### `backend/src/api/routes/admin.routes.ts`
Добавлены `/quiz-categories` CRUD-маршруты.

---

## Frontend

### `frontend/src/models/quiz.ts`
Добавлены `QuizCategory` interface, `QuizCategoriesResponse`, поля `category_id` и `category` в `Quiz`.

### `frontend/src/api/index.ts`
Добавлен `getQuizCategories()`.

### `frontend/src/hooks/quize/useQuiz.ts`
- Загружает категории параллельно с квизами
- Хранит `selectedCategoryId` (null = все)
- `newQuizzes` / `completedQuizzes` фильтруются по `selectedCategoryId`
- При смене категории — сбрасывает на первый квиз в отфильтрованном списке
- Экспортирует `categories`, `selectedCategoryId`, `setSelectedCategoryId`

### `frontend/src/pages/Quiz.tsx`
Добавлена полоса кнопок-категорий (`ScrollArea` с горизонтальным скроллом). При смене категории фильтрует списки квизов.

### `frontend/src/components/quiz/QuizResult.tsx`
- `isSuccess = correct === total` (все верно = пройден, вместо прежних 70%)
- Монеты показываются только при `isSuccess && coins > 0`
- Текст: "Нужно ответить верно на все вопросы" при неудаче
- Бейдж «Тест добавлен в Пройденные» при успехе
- Убран текст «Для перехода к следующему тесту...»

---

## Admin

### `ADMIN/src/api.ts`
- Добавлен `AdminQuizCategory`
- Добавлен `category_id` в `AdminQuiz`
- Добавлены методы: `getQuizCategories`, `createQuizCategory`, `updateQuizCategory`, `deleteQuizCategory`
- `createQuiz` / `updateQuiz` принимают `category_id`

### `ADMIN/src/pages/QuizzesPage.tsx`
- Раздел «Категории» в верхней части страницы: список категорий с инлайн-редактированием, кнопка «+ Категория»
- Форма создания/редактирования теста содержит обязательный селектор категории
