# Задача: Тип вопроса «Текстовый ввод» (автопроверка)

## Проблема

В тестах существовало только два вида вопросов:
- С вариантами ответа (`single_choice`, `multiple_choice`, `true_false`) — проверяются автоматически
- Развёрнутый ответ (`open_ended`) — требует проверки преподавателем (платно, 10 монет)

Не было возможности создать вопрос, где ученик вводит короткий текстовый ответ, а система автоматически проверяет его по эталонной строке.

---

## Что сделано

Добавлен новый тип вопроса `text_input` («Текстовый ввод (автопроверка)»):
- Ученик печатает ответ в текстовое поле
- Система сравнивает введённое с эталонным ответом (`correct_text_answer`), заданным в админке
- Сравнение без учёта регистра и лишних пробелов
- При правильном ответе начисляются монеты и очки, как у обычных вопросов
- Поддерживается таймер, пояснение, изображение — всё как для других типов

---

## Изменения в БД

Новые изменения применяются автоматически через `sync({ alter: true })`:
- `quiz_questions`: добавлен столбец `correct_text_answer` (TEXT, nullable)
- `quiz_questions.question_type`: в ENUM добавлено значение `'text_input'`

---

## Backend

### `backend/src/models/Quiz.ts`

`QuizQuestion`:
- `question_type` ENUM: добавлено `'text_input'`
- добавлено: `correct_text_answer?: string | null` (DataTypes.TEXT, allowNull: true)
- `QuizQuestionCreationAttributes`: `correct_text_answer` добавлен в список необязательных полей

### `backend/src/api/controllers/admin.controller.ts`

**`createQuestion`** и **`updateQuestion`**:
- TypeScript union `question_type` дополнен: `'open_ended' | 'text_input'` (также исправлено отсутствие `'open_ended'` из предыдущей версии)
- Принимают и сохраняют `correct_text_answer`

### `backend/src/api/controllers/quizzes.controller.ts`

**`details`** endpoint: в маппинг вопроса добавлено поле:
```typescript
correct_text_answer: question.correct_text_answer ?? null,
```

---

## Admin

### `ADMIN/src/api.ts`

`AdminQuizQuestion`:
- `question_type` union дополнен `'text_input'`
- добавлено: `correct_text_answer: string | null`

`createQuestion` / `updateQuestion` body-типы: добавлен `correct_text_answer?: string | null`

### `ADMIN/src/pages/QuizzesPage.tsx`

- `QUESTION_TYPES`: добавлен `{ value: 'text_input', label: 'Текстовый ввод (автопроверка)' }`
- `emptyQuestionForm()` / `QuestionForm`: добавлено поле `correct_text_answer: ''`
- `QuestionFormFields`: при `question_type === 'text_input'` появляется синее поле «Эталонный ответ» с подписью «Сравнение без учёта регистра и лишних пробелов»
- `startEditQuestion`: заполняет `correct_text_answer` при редактировании
- `handleCreateQuestion` / `handleUpdateQuestion`: передают `correct_text_answer` (только для `text_input`, иначе `null`)
- В списке вопросов: для `text_input` показывает `✎ «ответ»` вместо «N вариантов»
- В раскрытом вопросе: синий блок «Эталонный ответ: ...» вместо секции вариантов; кнопка «+ Вариант ответа» скрыта

---

## Frontend

### `frontend/src/models/quiz.ts`

`QuizQuestion`:
- `question_type` union: добавлен `'text_input'`
- добавлено: `correct_text_answer?: string | null`

### `frontend/src/hooks/quize/useQuiz.ts`

- Добавлен state `textAnswer: string` (сбрасывается в `resetQuizState()` и при переходе к следующему вопросу)
- Функция `normalizeText(s)`: `trim + toLowerCase + replace(/\s+/g, ' ')`
- **`checkAnswer()`** дополнен веткой для `text_input`:
  ```typescript
  if (currentQuestion.question_type === "text_input") {
    if (!textAnswer.trim()) return;
    const isCorrect = !!correct_text_answer &&
      normalizeText(textAnswer) === normalizeText(correct_text_answer);
    setAnswerState(isCorrect ? "correct" : "incorrect");
    setHistory(...);
    if (isCorrect) setCoins(...);
    return;
  }
  ```
- Экспортирует `textAnswer` и `setTextAnswer`
- `finishSnapshot` (уже реализован): в `next()` снимается снапшот `{ scoredTotal, correct, earnedCoins }` перед async `finishQuiz()`, чтобы экран результата не зависел от `quiz`, который перезагружается в `loadQuizzes()`

### `frontend/src/pages/Quiz.tsx`

- Добавлена переменная `isTextInput = currentQuestion?.question_type === 'text_input'`
- В рендере вопроса: ветка `isTextInput` → `<TextInput>` вместо `QuizOptions`
  - В режиме просмотра (`isViewOnly`): показывает `correct_text_answer`, заблокирован
  - Поддерживает Enter для быстрой проверки
- Пояснение (`QuizExplanation`):
  - Для `text_input`: при ошибке показывает «Неверно. Правильный ответ: ...»
- Футер (`QuizFooter`): `canCheck` для `text_input` = `textAnswer.trim().length > 0 && answerState === 'idle'`

---

## Изменённые файлы

- `backend/src/models/Quiz.ts`
- `backend/src/api/controllers/admin.controller.ts`
- `backend/src/api/controllers/quizzes.controller.ts`
- `ADMIN/src/api.ts`
- `ADMIN/src/pages/QuizzesPage.tsx`
- `frontend/src/models/quiz.ts`
- `frontend/src/hooks/quize/useQuiz.ts`
- `frontend/src/pages/Quiz.tsx`

---

## UX-сценарий

1. **Администратор** создаёт вопрос типа «Текстовый ввод (автопроверка)»
2. Заполняет поле «Эталонный ответ» — например, `митоз` или `АТФ`
3. Опционально: заполняет «Пояснение к ответу»

**Ученик:**
1. Видит вопрос с текстовым полем вместо вариантов
2. Вводит ответ, нажимает «Проверить» (или Enter)
3. Сразу видит: правильно (зелёный блок) или нет (красный блок с правильным ответом)
4. Нажимает «Далее» или «Завершить»
5. Монеты начисляются за правильный ответ как обычно

## Сравнение

`«  Митоз  »` === `«митоз»` → **правильно** (trim + toLowerCase)
`«МИТОЗ»` === `«митоз»` → **правильно**
`«мейоз»` === `«митоз»` → **неверно**
