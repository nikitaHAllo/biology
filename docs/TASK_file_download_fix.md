# Задача: Исправление скачивания файлов и упрощение раздела заданий

## Проблемы

### 1. CORS-ошибка при скачивании файлов
`useFileDownload.ts` использовал `fetch` для скачивания файлов. Google Drive, Яндекс.Диск и другие внешние хранилища блокируют `fetch`-запросы с чужого origin через CORS-политику — браузер получал ошибку `ERR_FAILED 403 (Forbidden)`.

### 2. Нерабочая функция «Скачать одним файлом»
Кнопка «Скачать одним файлом (N)» вызывала `handleBulkDownload`, который только логировал `console.log` — реальной реализации не было и не могло быть с внешними URL-ссылками.

---

## Что изменено

### `frontend/src/hooks/home/useFileDownload.ts`

Заменён `fetch`-подход на прямое открытие ссылки через `<a target="_blank">`:

```typescript
// было: fetch(file.file_url) → blob → createObjectURL → click
// стало:
const downloadFile = (file: TopicFile) => {
    setDownloading(file.id.toString());
    const a = document.createElement('a');
    a.href = file.file_url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(null), 500);
};
```

`fetch` к внешнему домену всегда блокируется CORS — браузер запрещает это по дизайну. Прямой переход по ссылке через `<a>` CORS не затрагивает.

### `frontend/src/components/home/TasksSection.tsx`

- Удалена кнопка «Скачать одним файлом (N)»
- Удалены чекбоксы «В пакет» с карточек заданий
- Удалены пропсы `selected`, `toggle`, `bulk` из интерфейса компонента
- Кнопка «Скачать» на карточке задания теперь `component="a"` с `target="_blank"` — без хука

### `frontend/src/hooks/home/useHomeData.ts`

- Удалены `selectedTasks` (state), `toggleTaskSelection`, `handleBulkDownload`
- Удалены из возвращаемого объекта хука

### `frontend/src/pages/Home.tsx`

- Удалены `selectedTasks`, `toggleTaskSelection`, `handleBulkDownload` из деструктуризации
- Удалены пропсы `selected`, `toggle`, `bulk` при передаче в `TasksSection`
