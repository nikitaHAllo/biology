# Задача: Развёрнутые ответы (часть 2 ЕГЭ)

## Что сделано

Добавлен новый тип вопроса `open_ended` — пользователь пишет произвольный текст. Автопроверки нет. За 10 репкоинов можно запросить проверку у преподавателя. Результат проверки (балл + комментарий) отображается в интерфейсе. Администратор видит все присланные ответы на отдельной странице и может выставлять оценки.

## Изменения в БД

Применяются автоматически при старте через `sequelize.sync({ alter: true })` и raw-SQL в `init.ts`:

- **`quiz_questions.question_type`** (ENUM): добавлено значение `open_ended` через `ALTER TYPE ... ADD VALUE` (PostgreSQL не позволяет добавлять значения ENUM в транзакции — выполняется отдельным raw-запросом перед `sync()`).
- **Новая таблица `open_answers`**: `id`, `user_id`, `question_id`, `quiz_id`, `answer_text`, `review_status` ENUM(`not_requested`, `pending`, `reviewed`), `teacher_comment`, `score`, `repcoins_spent`, `submitted_at`, `reviewed_at`. Уникальный индекс: `(user_id, question_id)`.

## Backend

### `backend/src/db/init.ts`

Raw SQL перед `sequelize.sync()` добавляет значение `open_ended` в ENUM, если его ещё нет.

### `backend/src/models/Quiz.ts`

`question_type` расширен: добавлено `'open_ended'` в union-тип и `DataTypes.ENUM(...)`.

### `backend/src/models/OpenAnswer.ts` (новый)

Sequelize-модель для таблицы `open_answers` с ассоциациями к `User` и `QuizQuestion`.

### `backend/src/models/index.ts`

Импорт и ассоциации `OpenAnswer`:
- `User.hasMany(OpenAnswer)` / `OpenAnswer.belongsTo(User)`
- `QuizQuestion.hasMany(OpenAnswer)` / `OpenAnswer.belongsTo(QuizQuestion)`

### `backend/src/api/controllers/openAnswers.controller.ts` (новый)

- `submitAnswer` — upsert по `(user_id, question_id)`, обновляет текст пока не начата проверка.
- `getAnswer` — возвращает сохранённый ответ пользователя.
- `requestReview` — списывает 10 репкоинов, устанавливает статус `pending`.
- `adminList` — все ответы с данными пользователя и вопроса (для страницы проверки).
- `adminReview` — выставляет `score`, `teacher_comment`, статус `reviewed`, дату `reviewed_at`.

### `backend/src/api/routes/quizzes.routes.ts`

Новые маршруты (требуют `authenticateUser`):
- `POST /questions/:questionId/open-answer`
- `GET  /questions/:questionId/open-answer`
- `POST /open-answers/:id/request-review`

### `backend/src/api/routes/admin.routes.ts`

- `GET  /open-answers` → `adminList`
- `PUT  /open-answers/:id/review` → `adminReview`

## Admin

### `ADMIN/src/api.ts`

Добавлены интерфейс `AdminOpenAnswer` и методы `getOpenAnswers()`, `reviewOpenAnswer(id, body)`.

### `ADMIN/src/pages/OpenAnswersPage.tsx` (новый)

- Три вкладки: «Ожидают проверки» / «Все» / «Проверены».
- Карточка каждого ответа: пользователь, вопрос, текст ответа, дата, статус.
- Инлайн-форма проверки: поле балла (число) + комментарий (textarea) + кнопка «Сохранить оценку».
- Цветные бейджи статусов.

### `ADMIN/src/App.tsx`

Добавлена страница `'open-answers'` с кнопкой «📝 Проверка ответов» в навигации.

## Frontend

### `frontend/src/models/quiz.ts`

`question_type` расширен: добавлено `'open_ended'`.

### `frontend/src/api/index.ts`

Интерфейс `OpenAnswerData` и методы:
- `submitOpenAnswer(questionId, quizId, answerText)`
- `getOpenAnswer(questionId)`
- `requestOpenAnswerReview(answerId)`

### `frontend/src/components/quiz/OpenAnswerInput.tsx` (новый)

- Загружает существующий ответ при монтировании.
- `<Textarea>` заблокирован, если статус `pending` или `reviewed`.
- Кнопка «Сохранить ответ» — активна, если текст изменён и не пустой.
- Карточка «Запросить проверку (10 монет)» — появляется после сохранения; заблокирована если монет меньше 10.
- Оранжевое уведомление при `pending`, зелёное с баллом и комментарием при `reviewed`.

### `frontend/src/pages/Quiz.tsx`

- Таймер отключён для `open_ended`-вопросов.
- Вместо `<QuizOptions>` рендерится `<OpenAnswerInput>` с текущим количеством монет пользователя.
- Вместо `<QuizFooter>` простая кнопка «Далее →» / «Завершить →».
- Блок объяснения скрыт для `open_ended`.
