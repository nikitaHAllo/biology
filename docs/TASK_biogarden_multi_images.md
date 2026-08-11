# Задача: Несколько изображений для растений в Биосадовнике

## Что сделано

Добавлена поддержка нескольких изображений (URL) для каждого растения. В админке — список URL с возможностью добавлять и удалять записи с превью. На фронте — простая галерея с кнопками «← Пред.» / «След. →».

Обратная совместимость сохранена: поле `image_url` продолжает хранить первый URL из массива; если `image_urls` пуст, используется `image_url`.

## Изменения в БД

Добавляется автоматически через `sequelize.sync({ alter: true })`:
- `bio_garden_plants.image_urls` — `ARRAY(TEXT)`, `NOT NULL`, `DEFAULT '{}'`

## Backend

### `backend/src/models/BioGardenPlant.ts`

Добавлено поле `image_urls: string[]` в интерфейс `BioGardenPlantAttributes`, класс и `init()`:  
`DataTypes.ARRAY(DataTypes.TEXT), allowNull: false, defaultValue: []`.

### `backend/src/api/controllers/admin.controller.ts`

- `createBioGardenPlant`: принимает `image_urls[]`, автоматически синхронизирует `image_url` с первым элементом массива.
- `updateBioGardenPlant`: обрабатывает `image_urls`, обновляет `image_url` из первого элемента.

### `backend/src/api/controllers/biogarden.controller.ts`

- В маппинге `available_plants` добавлено `image_urls: p.image_urls ?? []`.
- В `attributes` запроса слотов добавлено поле `'image_urls'`.

## Admin

### `ADMIN/src/api.ts`

- `AdminBioGardenPlant` получил поле `image_urls: string[]`.
- Сигнатуры `createBioGardenPlant` и `updateBioGardenPlant` обновлены.

### `ADMIN/src/pages/BioGardenPage.tsx`

Форма `PlantForm`:
- Единственное поле URL заменено на динамический список `imageUrls: string[]`.
- Кнопка «+ Добавить изображение» добавляет новую строку.
- Кнопка «✕» справа удаляет строку (видна только если элементов больше одного).
- Под каждым URL — инлайн-превью картинки.
- При сохранении пустые строки фильтруются; в тело запроса передаётся `image_urls[]` и `image_url` (первый элемент).

## Frontend

### `frontend/src/models/biogarden.ts`

Добавлено `image_urls?: string[]` в интерфейсы `BioGardenPlant` и `AvailablePlant`.

### `frontend/src/components/game/BioGardenGame.tsx`

- Вычисляется массив `activePlantImages: string[]` — из `image_urls` (если не пуст) или fallback на `[image_url]`.
- Добавлено состояние `galleryIndex: number`, сбрасывается при смене слота.
- Вместо одного `<Image>` — галерея:
  - Счётчик «N / Total» (виден только если картинок больше одной).
  - Кнопки «← Пред.» и «След. →» под изображением.
  - `activePlantImageUrl = activePlantImages[galleryIndex]` — текущее изображение.
