# Задача: Управление тестами в Админ-панели

**Дата:** 2026-05-05

## Цель

Добавить в ADMIN-панель полный CRUD для тестов (квизов): создание, редактирование, удаление тестов, вопросов и вариантов ответов. Удалить моковые тесты из seed-данных.

---

## Что было изменено

### Backend

**`backend/src/models/Quiz.ts`**
- Добавлены поля: `coins_reward` (INTEGER, default 0), `difficulty` (ENUM: easy/medium/hard, default medium), `topic_tag` (STRING, nullable)
- Обновлены интерфейсы `QuizAttributes` и `QuizCreationAttributes`

**`backend/src/api/controllers/admin.controller.ts`**
- Добавлен импорт `Quiz, QuizQuestion, QuizOption`
- Добавлены методы: `getQuizzes`, `getQuiz`, `createQuiz`, `updateQuiz`, `deleteQuiz`
- Добавлены методы: `createQuestion`, `updateQuestion`, `deleteQuestion`
- Добавлены методы: `createOption`, `updateOption`, `deleteOption`
- Приватный метод `_recalcQuizTotals` — пересчитывает `total_questions` и `total_points` при изменении вопросов

**`backend/src/api/routes/admin.routes.ts`**
- Добавлены маршруты: `GET/POST /quizzes`, `GET/PUT/DELETE /quizzes/:id`
- Добавлены маршруты: `POST /quizzes/:quizId/questions`, `PUT/DELETE /questions/:id`
- Добавлены маршруты: `POST /questions/:questionId/options`, `PUT/DELETE /options/:id`

**`backend/src/api/controllers/quizzes.controller.ts`** — метод `complete()`
- Убрана зависимость от клиентского `earned_coins` (теперь берём из `quiz.coins_reward`)
- Логика монет:
  - Первое прохождение → начисляем `quiz.coins_reward`
  - Повторное, предыдущий результат `is_passed = true` → 0 монет
  - Повторное, предыдущий `is_passed = false` → начисляем `quiz.coins_reward` (как новое)
- `is_passed` теперь `score === quiz.total_questions` (все вопросы верно)

**`backend/src/db/seedCatalog.ts`**
- Удалены `quizzesSeed`, тип `QuizSeed`, функция `seedQuizzes()`
- `seedCatalogData()` теперь вызывает только `seedMaterials()`

### Frontend ADMIN

**`ADMIN/src/api.ts`**
- Добавлены интерфейсы: `AdminQuizOption`, `AdminQuizQuestion`, `AdminQuiz`
- Добавлены API-методы: `getQuizzes`, `getQuiz`, `createQuiz`, `updateQuiz`, `deleteQuiz`
- Добавлены API-методы: `createQuestion`, `updateQuestion`, `deleteQuestion`
- Добавлены API-методы: `createOption`, `updateOption`, `deleteOption`

**`ADMIN/src/pages/QuizzesPage.tsx`** (новый файл)
- 3-уровневый аккордеон: Тест → Вопросы → Варианты ответов
- Создание/редактирование/удаление на каждом уровне
- Форма теста: название, тема/тег, сложность, монеты, минуты, описание, is_active
- Форма вопроса: текст, тип (один/несколько/верно-неверно), порядок, таймер, пояснение
- Форма варианта: текст, флаг "верный ответ"
- Lazy-loading деталей теста (вопросы+варианты загружаются при раскрытии)

**`ADMIN/src/App.tsx`**
- Добавлен импорт `QuizzesPage`
- Добавлена кнопка "🧪 Тесты" в навигацию
- Добавлен рендер `{page === 'quizzes' && <QuizzesPage />}`

---

## БД: что дропать и пересоздавать

Таблицы с новыми полями:
- `quizzes` — добавлены: `coins_reward`, `difficulty`, `topic_tag`

Связанные таблицы (каскадно зависят, но схема не менялась):
- `quiz_questions`, `quiz_options` — без изменений

---

## Структура данных

```
Quiz
  ├── coins_reward: number      — монеты за прохождение всего теста
  ├── difficulty: easy|medium|hard
  ├── topic_tag: string | null  — для фильтрации по теме
  └── Questions[]
        ├── question_type: single_choice | multiple_choice | true_false
        ├── points: number       — очки за вопрос (для total_points)
        ├── timer_seconds        — лимит времени на вопрос
        └── Options[]
              └── is_correct: boolean
```

---

## Логика монет (итоговая)

| Ситуация | Монеты |
|---|---|
| Первое прохождение | `quiz.coins_reward` |
| Повтор, до этого был идеален (все верно) | 0 |
| Повтор, до этого не был идеален | `quiz.coins_reward` |
