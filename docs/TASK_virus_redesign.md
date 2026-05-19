# Задача: Переработка Вирусного детектива

## Что сделано

Игра полностью переработана: вместо механики «открывай улики → угадай подозреваемого» теперь пошаговое нарративное расследование по главам. Каждая глава — фрагмент истории, вопрос и 2–3 варианта ответа с текстом последствия.

## Изменения в БД

Две новые таблицы создаются автоматически через `sync({ alter: true })`:
- `virus_chapters` — главы кейса
- `virus_chapter_options` — варианты ответа к каждой главе

Новые колонки в существующих таблицах (добавляются автоматически):
- `virus_cases`: `role_description`, `success_text`, `failure_text` (TEXT, nullable)
- `virus_results`: `correct_answers` (INTEGER, default 0)

---

## Backend

### `backend/src/models/Virus.ts`

Добавлены две новые модели:

**`VirusChapter`** (таблица `virus_chapters`):
- `case_id`, `order_index`, `title`, `narrative_text`, `question_text`
- Без `references` в определении колонки (во избежание бага Sequelize ALTER)

**`VirusChapterOption`** (таблица `virus_chapter_options`):
- `chapter_id`, `order_index`, `text`, `is_correct`, `consequence_text`

В `VirusCase` добавлены поля: `role_description`, `success_text`, `failure_text` (TEXT, nullable).

В `VirusResult` добавлено поле: `correct_answers` (INTEGER, default 0).

### `backend/src/models/index.ts`

Добавлены ассоциации с `constraints: false`:
```typescript
VirusCase.hasMany(VirusChapter, { foreignKey: 'case_id', as: 'chapters', constraints: false });
VirusChapter.hasMany(VirusChapterOption, { foreignKey: 'chapter_id', as: 'options', constraints: false });
```

### `backend/src/api/controllers/virus.controller.ts`

Полная переработка. Четыре метода:

- **`list()`** — активные кейсы + статус прохождения пользователя
- **`getCase()`** — кейс с главами и вариантами ответов (`is_correct` скрыт)
- **`submitAnswer()`** — `POST /:caseId/chapters/:chapterId/answer` — принимает `optionId`, возвращает `{ is_correct, consequence_text, correct_option_id }`
- **`complete()`** — `POST /:id/complete` — счёт = correct/total*100, монеты начисляются только при первом прохождении (score ≥ 50%), создаёт `WalletTransaction`

### `backend/src/api/routes/admin.routes.ts`

Новые маршруты для глав и вариантов:
```
POST   /virus/cases/:caseId/chapters
PUT    /virus/chapters/:id
DELETE /virus/chapters/:id
POST   /virus/chapters/:chapterId/options
PUT    /virus/chapter-options/:id
DELETE /virus/chapter-options/:id
```

### `backend/src/api/controllers/admin.controller.ts`

Добавлены методы: `createVirusChapter`, `updateVirusChapter`, `deleteVirusChapter`, `createVirusChapterOption`, `updateVirusChapterOption`, `deleteVirusChapterOption`.

Обновлены `createVirusCase` и `updateVirusCase` — принимают `role_description`, `success_text`, `failure_text`.

---

## Frontend

### `frontend/src/models/virus.ts`

Новые интерфейсы:
- `VirusChapterOption` — `id`, `text`, `consequence_text`, `order_index` (без `is_correct` — скрыт от клиента)
- `VirusChapter` — `id`, `title`, `narrative_text`, `question_text`, `options`
- Обновлён `VirusCase` — добавлены `role_description`, `success_text`, `failure_text`, `chapters`
- `SubmitAnswerResponse` — `is_correct`, `consequence_text`, `correct_option_id`
- `CompleteVirusCaseResponse` — `coins_earned`, `score`, `is_passed`, `correct_answers`, `total_chapters`

### `frontend/src/api/index.ts`

Обновлены методы:
```typescript
submitVirusAnswer(caseId, chapterId, optionId)
completeVirusCase(caseId, correctAnswers, totalChapters, telegramId?)
```

### `frontend/src/components/game/VirusGame.tsx`

Полная переработка UI. Четыре экрана:

1. **Список кейсов** — карточки с бейджами сложности/монет/прохождения
2. **Вступление** — название, описание, `role_description` (твоя роль), кнопка «Начать расследование»
3. **Глава** — прогресс-бар, нарратив (синий блок), вопрос, кнопки A/B/C; после ответа: подсвечивается правильный (зелёный) и неверный (красный) вариант + `consequence_text` (жёлтый блок), кнопка «Следующая глава»
4. **Финал** — счёт X/Y (%), `success_text` или `failure_text`, начисленные монеты, кнопка «Вернуться к делам»

---

## Admin

### `ADMIN/src/api.ts`

Новые интерфейсы: `AdminVirusChapter`, `AdminVirusChapterOption`.

Обновлён `AdminVirusCase` — добавлены `role_description`, `success_text`, `failure_text`, `chapters`.

Добавлены методы для CRUD глав и вариантов.

### `ADMIN/src/pages/VirusPage.tsx`

Полная переработка. Форма кейса теперь включает поля `role_description`, `success_text`, `failure_text`. Раздел «Улики / Подозреваемые» заменён разделом «Главы»: каждая глава раскрывается, показывает нарратив, вопрос и варианты ответов. Предупреждение, если у главы отмечено несколько правильных вариантов.
