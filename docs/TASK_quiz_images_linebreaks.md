# Задача: Изображения к вопросам теста и перенос строк

## Что сделано

1. Добавлена возможность прикреплять изображение (URL) к вопросу теста — отображается между заголовком вопроса и вариантами ответов.
2. Включён перенос строк в тексте вопроса: Enter в форме создаёт абзацы, на фронте они рендерятся через `white-space: pre-wrap`.

## Backend

### `backend/src/models/Quiz.ts`

- Добавлено поле `image_url?: string | null` в интерфейс `QuizQuestionAttributes`, класс и `init()`:  
  `DataTypes.STRING(1024), allowNull: true`.

### `backend/src/api/controllers/admin.controller.ts`

- `createQuestion` и `updateQuestion` принимают и сохраняют `image_url`.

## Admin

### `ADMIN/src/api.ts`

- `AdminQuizQuestion` получил поле `image_url: string | null`.
- Сигнатуры `createQuestion` и `updateQuestion` обновлены.

### `ADMIN/src/pages/QuizzesPage.tsx`

- `emptyQuestionForm()` инициализирует `image_url: ''`.
- `startEditQuestion` заполняет `image_url`.
- `QuestionFormFields`: поле `question_text` заменено на `<textarea rows={3} style={{ resize: 'vertical' }}>` (поддержка переносов строк).
- Добавлено поле URL изображения с инлайн-превью.

## Frontend

### `frontend/src/models/quiz.ts`

Добавлено `image_url?: string | null` в `QuizQuestion`.

### `frontend/src/components/quiz/QuizHeader.tsx`

Добавлен `style={{ whiteSpace: 'pre-wrap' }}` на элемент с текстом вопроса — сохраняет переносы строк.

### `frontend/src/pages/Quiz.tsx`

Блок изображения между `QuizHeader` и `QuizOptions`:
```tsx
{currentQuestion.image_url && (
  <Card withBorder padding='md' style={{ textAlign: 'center' }}>
    <img src={currentQuestion.image_url} ... />
  </Card>
)}
```
