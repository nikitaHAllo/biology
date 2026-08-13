# Задача: Финальная глава и начисление монет в Вирусном детективе

## Проблемы

1. **Нельзя создать финал игры.** В админке можно было создавать только обычные главы (нарратив + вопрос + варианты ответов). Не было способа добавить заключительную нарративную главу, которая явно завершала бы расследование.

2. **Монеты не начислялись.** `completeVirusCase` вызывался без `telegramId`. Для пользователей Telegram Mini App без JWT-токена бэкенд не мог найти пользователя (`resolveUser` возвращал `null`), возвращал 401, и ошибка тихо проглатывалась в `.catch`. Монеты не записывались.

---

## Что сделано

### Новая концепция: Финальная глава (`is_final`)

Добавлено поле `is_final: boolean` в модель `VirusChapter`. Финальная глава:
- содержит только нарративный текст (заключение истории)
- **не имеет** вопроса и вариантов ответа
- **не засчитывается** в знаменатель счёта (`correct / scored_total`)
- в игре сразу показывает кнопку «Завершить расследование →»
- после неё вызывается `POST /virus/cases/:id/complete` и начисляются монеты

---

## Изменения в БД

Новая колонка добавляется автоматически через `sync({ alter: true })`:
- `virus_chapters`: `is_final` (BOOLEAN, default `false`)
- `virus_chapters`: `question_text` стало nullable (NULL для финальных глав)

---

## Backend

### `backend/src/models/Virus.ts`

`VirusChapter`:
- `question_text`: `allowNull: true` (было `false`)
- добавлено: `is_final: { type: DataTypes.BOOLEAN, defaultValue: false }`

### `backend/src/api/controllers/admin.controller.ts`

**`createVirusChapter`:**
- принимает `is_final?: boolean`
- если `is_final: true` — `question_text` не обязателен, сохраняется как `null`
- если `is_final: false` — `question_text` обязателен (400 если отсутствует)

**`updateVirusChapter`:**
- принимает `is_final?: boolean`
- при `is_final: true` сбрасывает `question_text` в `null`

---

## Frontend

### `frontend/src/models/virus.ts`

`VirusChapter`:
- `question_text?: string | null` (было обязательным `string`)
- добавлено: `is_final?: boolean`

### `frontend/src/api/index.ts`

Без изменений — `completeVirusCase(caseId, correctAnswers, totalChapters, telegramId?)` уже принимал `telegramId`, просто не передавался.

### `frontend/src/components/game/VirusGame.tsx`

- Добавлен `useTelegram()` hook → `telegramIdRef` (через ref, чтобы не менять зависимости useEffect)
- `completeVirusCase` теперь получает `telegramId` из Telegram-контекста
- Счёт считается только по обычным главам: `scoredTotal = chapters.filter(ch => !ch.is_final).length`
- Рендер финальной главы: пропускает блок вопроса/вариантов, сразу показывает кнопку «Завершить расследование →» (или «Далее →» если не последняя)
- В заголовке главы отображается метка **★ ФИНАЛ**

---

## Admin

### `ADMIN/src/api.ts`

`AdminVirusChapter`:
- `question_text: string | null`
- добавлено: `is_final: boolean`

`createVirusChapter` / `updateVirusChapter` — типы обновлены: `question_text` опциональный, добавлен `is_final`.

### `ADMIN/src/pages/VirusPage.tsx`

**`ChapterForm`:**
- Чекбокс «★ Финальная глава (без вопроса — только нарратив, завершает игру)»
- При включении: поле «Вопрос» скрывается, фон формы желтеет, кнопка «Сохранить» становится янтарной
- При выключении: обычный вид, `question_text` обязателен

**`ChapterItem`:**
- Финальные главы показывают бейдж **★ ФИНАЛ** вместо счётчика вариантов
- В раскрытом виде — информационный баннер «Финальная глава — показывает только нарратив, не считается в счёте»
- Секция «Варианты ответа» полностью скрыта для финальных глав

---

## Изменённые файлы

- `backend/src/models/Virus.ts`
- `backend/src/api/controllers/admin.controller.ts`
- `frontend/src/models/virus.ts`
- `frontend/src/components/game/VirusGame.tsx`
- `ADMIN/src/api.ts`
- `ADMIN/src/pages/VirusPage.tsx`

---

## Как использовать

**Типичная структура кейса:**
1. Глава 1 (обычная) — контекст + вопрос + варианты
2. Глава 2 (обычная) — продолжение расследования
3. ...
4. Глава N (обычная) — финальное решение
5. **Эпилог (финальная)** — заключительный нарратив без вопроса

При прохождении: игрок читает эпилог → нажимает «Завершить расследование» → начисляются монеты (если ≥50% правильных ответов в обычных главах).

Финальная глава необязательна — игра корректно завершается и без неё, просто после последней обычной главы.
