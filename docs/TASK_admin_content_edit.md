# Задача: Редактирование файлов и монет в разделе «Контент» админки

## Что сделано

Добавлена возможность редактировать записи файлов (название, URL, тип) и цену темы в репкоинах (`price_repcoins`) прямо в таблице, без перехода на отдельную страницу.

## Backend

### `backend/src/api/controllers/admin.controller.ts`

- `updateFile(req, res)` — PUT `/admin/files/:id`: обновляет поля `name`, `file_url`, `file_type` у записи файла.
- `updateTopic(req, res)` — PUT `/admin/topics/:id`: обновляет `price_repcoins`, `is_default_unlocked` и другие поля темы.

### `backend/src/api/routes/admin.routes.ts`

Добавлены маршруты:
- `PUT /files/:id` → `updateFile`
- `PUT /topics/:id` → `updateTopic`

## Admin

### `ADMIN/src/api.ts`

- `updateFile(id, body)` — PUT /files/:id
- `updateTopic(id, body)` — PUT /topics/:id

### `ADMIN/src/pages/ContentPage.tsx`

Полная переработка:

- **Редактирование файла**: строка переходит в режим редактирования по кнопке ✏️. В режиме редактирования — инлайн-форма с полями `name`, `file_url`, `file_type`, кнопки «Сохранить» / «Отмена».
- **Редактирование монет темы**: бейдж с монетами имеет кнопку ✏️. В режиме редактирования — числовое поле + чекбокс `is_default_unlocked`.
- Состояния: `editingFile: Record<number, FileEditState>` и `editingTopicCoins: Record<number, TopicCoinsEditState>`.
