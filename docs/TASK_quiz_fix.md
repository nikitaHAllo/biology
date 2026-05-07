# Задача: Исправление системы квизов

## Проблемы

### 1. Пройденный квиз оставался во вкладке «Новые»
`UserQuizResult` создавался с `is_passed = scoreNum === total_questions` (только 100%). В `list()` контроллера флаг `is_completed` выставлялся как `!!result?.is_passed` — то есть только при идеальном прохождении. Квизы, где не все вопросы правильные, не попадали в «Пройденные».

### 2. Прогресс в личном кабинете не считался
`buildStatsJson` в `users.controller.ts` считал `total_lessons = await Lesson.count()`, а завершёнными считал `UserProgress` записи со `status === 'completed'`. Но `UserProgress` никогда не получал `status: 'completed'` — в `complete()` статус ставился `isPassed ? 'completed' : 'pending'`, то есть только при 100%.

### 3. Квизы были недоступны для web-пользователей
`finishQuiz()` в `useQuiz.ts` имел guard `if (!quiz || !user) return`, где `user` — Telegram-объект. Для web-пользователей `user === null`, поэтому квиз никогда не завершался.

### 4. Нет режима просмотра пройденных квизов
Переключение на вкладку «Пройденные» показывало интерактивный квиз без ограничений — пользователь мог «перепройти» его.

---

## Что изменено

### Backend: `backend/src/api/routes/quizzes.routes.ts`
Добавлен `optionalAuth` к `GET /` и `POST /:quizId/complete` — теперь JWT-токен web-пользователей распознаётся.

### Backend: `backend/src/api/controllers/quizzes.controller.ts`

**Добавлен `resolveUser(req)`:**
```typescript
private async resolveUser(req: Request): Promise<User | null> {
    if (req.user) return req.user;  // JWT
    const telegramId = (req.query.telegramId ?? req.body?.telegramId) as string | undefined;
    if (!telegramId) return null;
    return User.findOne({ where: { telegram_id: Number(telegramId) } });
}
```

**Исправлен `list()`:**
- Теперь использует `resolveUser` вместо поиска по `telegramId` из query
- `is_completed: !!result?.is_passed` — оставлено как есть (только 100% = пройден; логика повторного прохождения описана в `TASK_quiz_categories.md`)

**Исправлен `complete()`:**
- Использует `resolveUser(req)` вместо `User.findOne({ telegram_id })`
- Логика статусов и монет пересмотрена в `TASK_quiz_categories.md` (только 100% = completed, монеты только при is_passed)

### Backend: `backend/src/api/controllers/users.controller.ts`

**Исправлен `buildStatsJson`:**
```typescript
// было:
const totalLessons = await Lesson.count();
const completedLessons = userProgress.filter(p => p.status === 'completed').length;
// стало:
const totalQuizzes = await Quiz.count({ where: { is_active: true } });
const completedQuizzes = await UserProgress.count({ where: { user_id: userData.id, status: 'completed' } });
```
Теперь прогресс в профиле показывает реальный счёт по квизам.

### Frontend: `frontend/src/models/quiz.ts`

```typescript
// было:
telegramId: number;
// стало:
telegramId?: number;  // опционально — JWT-пользователи не передают
```

### Frontend: `frontend/src/hooks/quize/useQuiz.ts`

- Убран `!user` из guard в `finishQuiz`
- `telegramId: user?.id` вместо `user.id` (опциональная передача)
- Добавлена функция `prevQuestion()` для навигации назад в режиме просмотра
- `prevQuestion` добавлен в возвращаемый объект хука

### Frontend: `frontend/src/pages/Quiz.tsx`

**Режим просмотра** (`isViewOnly = activeList === 'completed'`):
- Таймер не запускается
- Опции показываются с правильными ответами (`selected = correct_answer_ids`), `disabled = true`
- Вместо QuizFooter — кнопки «← Назад» / «Вперёд →»
- Объяснение показывается всегда (без зависимости от `answerState`)
- Зелёный баннер «Режим просмотра — тест пройден»
- Экран результата не показывается при `isViewOnly`

### Frontend: `frontend/src/pages/Profile.tsx`

- Карточка «Прогресс обучения» переименована в «Прогресс по тестам»
- Метка «Завершено уроков» → «Тестов пройдено»

## Изменений в БД нет
Таблицы `user_quiz_results` и `user_progress` уже содержат нужные поля. Исправление логики в контроллере достаточно.
