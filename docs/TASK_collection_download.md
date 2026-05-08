# Задача: Кнопка «Скачать коллекцию» для готовых подборок

## Что сделано

Добавлена возможность прикреплять прямую ссылку на скачивание (архив на Яндекс.Диске или другом хранилище) к готовым коллекциям заданий. Студент нажимает кнопку — архив скачивается напрямую.

## Концепция

Коллекция = просто ссылка. Администратор собирает архив на Яндекс.Диске, копирует прямую ссылку на скачивание и вставляет её в поле `download_url` при создании коллекции. Никакого ZIP на сервере создавать не нужно.

## Изменения в БД

Новая колонка в таблице `task_collections`:
```sql
ALTER TABLE task_collections ADD COLUMN IF NOT EXISTS download_url TEXT;
ALTER TABLE task_collections ALTER COLUMN download_url TYPE TEXT;
```

Тип `TEXT` (не `VARCHAR(255)`) — прямые ссылки Яндекс.Диска превышают 255 символов.

---

## Backend

### `backend/src/models/DownloadableTask.ts`

Добавлено поле `download_url?: string | null` в `TaskCollectionAttributes` и `TaskCollection.init()`:
```typescript
download_url: {
    type: DataTypes.TEXT,  // TEXT, не STRING — ссылки длиннее 255 символов
    allowNull: true,
}
```

### `backend/src/api/controllers/tasks.controller.ts`

`download_url` включён в ответ `listDownloads`:
```typescript
download_url: collection.download_url ?? null,
```

### `backend/src/api/controllers/admin.controller.ts`

`createCollection` принимает `download_url` из тела запроса.

---

## Frontend

### `frontend/src/models/task.ts`

Добавлено `download_url?: string | null` в интерфейс `TaskCollection`.

### `frontend/src/components/home/TasksSection.tsx`

Кнопка «Собрать коллекцию» заменена на «Скачать коллекцию»:
- `component="a"`, `href={collection.download_url}`, `target="_blank"`
- `disabled={!collection.download_url}` — если ссылка не задана, кнопка неактивна
- Счётчик заданий убран

### `frontend/src/pages/Home.tsx`

`download_url` добавлен в маппинг коллекций при передаче в `TasksSection`.

---

## Admin

### `ADMIN/src/api.ts`

- Добавлено `download_url: string | null` в `AdminCollection`
- `createCollection` принимает `download_url?: string`

### `ADMIN/src/pages/TasksPage.tsx`

- Поле «Ссылка для скачивания» в форме создания коллекции
- В заголовке коллекции бейдж «📎 ссылка есть» / «нет ссылки»
- Счётчик заданий убран из заголовков коллекций
- Если у коллекции есть `download_url` — внутри показывается сама ссылка вместо интерфейса добавления заданий
