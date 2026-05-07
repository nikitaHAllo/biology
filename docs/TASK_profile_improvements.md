# Задача: Улучшение личного кабинета

## Проблемы

### 1. Неверный расчёт прогресса обучения
`buildStatsJson` считал `total_lessons = await Quiz.count()` (все квизы в системе), а `completed_lessons` из `UserProgress` (записи о прохождении уроков). Это разные модели — сравнение было бессмысленным.

### 2. Профиль недоступен для web-пользователей
`Profile.tsx` содержал жёсткий guard `if (!user) return <Alert>...` где `user` — объект Telegram WebApp. Для пользователей вошедших через email/password `user` всегда `null`, поэтому они видели ошибку вместо профиля.

### 3. Email не возвращался в ответе API
`getProfileMe` не включал поле `email` в `attributes` запроса к БД, и `formatProfilePayload` его не передавал. Хотя поле есть в модели User и в интерфейсе `UserProfile` на фронте.

### 4. Нет данных о серии активности
Поля `current_streak` и `longest_streak` из модели User не включались в `getStats`, поэтому фронт их не получал.

### 5. Достижения показывались только счётчиком
Пользователь видел `N/M` без понимания что это за достижения и за что они даются.

### 6. Мало полезной информации
Отсутствовала статистика Биосадовника (растения, ответы, опыт).

---

## Что изменено

### Backend: `backend/src/api/controllers/users.controller.ts`

**Исправлен `buildStatsJson`:**
```typescript
// было:
const totalQuizzes = await Quiz.count();
// стало:
const totalLessons = await Lesson.count();
```
Теперь `completion_rate` = завершённые уроки пользователя / все уроки в системе.

**Добавлены `current_streak` и `longest_streak` в stats:**
- В `attributes` запроса добавлены `'current_streak'`, `'longest_streak'`
- В `UserWithAssociations` интерфейс добавлены эти поля
- В ответ `buildStatsJson` → `stats` добавлены `current_streak` и `longest_streak`

**Добавлен `email` в профиль:**
- В `getProfileMe` в `attributes` добавлен `'email'`
- В `formatProfilePayload` в объект `profile` добавлен `email: userData.email ?? null`

### Frontend: `frontend/src/models/user.ts`

Добавлены опциональные поля в `UserStats`:
```typescript
current_streak?: number;
longest_streak?: number;
```

### Frontend: `frontend/src/pages/Profile.tsx`

Полная переработка страницы:

**Фикс для web-пользователей:**
- Убран жёсткий `if (!user)` guard
- Проверка теперь: `!isLoading && !profile && !error && !user && !token`
- Имя для отображения собирается по приоритету: `profile.username` → `email prefix` → Telegram `first_name` → `'Пользователь'`
- Для web-пользователей показывается email, для Telegram — `@username`

**Новые карточки:**

| Карточка | Данные |
|---|---|
| Пользователь | Аватар с инициалами, имя, email/telegram, дата регистрации, монеты |
| Прогресс обучения | RingProgress + бар, N/M уроков завершено |
| Серия активности | Текущая серия в днях + рекорд (из `current_streak`/`longest_streak`) |
| Биосадовник | Растений начато/завершено, ответов, опыта XP (показывается только если пользователь играл) |
| Достижения | Полный список: каждое с иконкой, названием, описанием, датой получения. Незаработанные затемнены с замком |

**Статистика Биосадовника** загружается отдельным запросом `apiService.getBiogardenStats()` прямо в компоненте (не через `useUserData`). При ошибке — просто не показывается (silently fail).

## Изменений в БД нет
Все нужные поля (`current_streak`, `longest_streak`, `email`) уже существуют в таблице `users`. Биосадовник обновляет `current_streak` автоматически при правильных ответах.
