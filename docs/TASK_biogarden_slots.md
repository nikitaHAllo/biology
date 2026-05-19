# Задача: Пустые горшки и выбор растений в Биосадовнике

## Что сделано

Изменена механика старта игры: вместо того чтобы все растения из БД сразу появлялись у ученика, теперь показываются 8 пустых горшков. Ученик сам выбирает, какое растение посадить в каждый горшок.

## Изменения в БД

Новая колонка добавляется автоматически через `sync({ alter: true })`:
- `user_bio_garden_progress`: добавлена `slot_index` (INTEGER, nullable) — в какой горшок (0–7) посажено растение

## Backend

### `backend/src/models/UserBioGardenProgress.ts`

Добавлено поле `slot_index: number | null` в интерфейс, класс и `init()`.

### `backend/src/api/controllers/biogarden.controller.ts`

**`getPlants()`** — полная переработка формата ответа:
- Вместо плоского массива `plants` теперь возвращает:
  - `slots`: массив из 8 объектов `{ slot_index, plant: ... | null }` — каждый слот либо пустой, либо содержит растение с прогрессом пользователя
  - `available_plants`: массив растений, которые ещё не посажены этим пользователем (для показа в пикере)
  - `user_coins`, `total_experience` — без изменений

**`startPlant()`** — обновлена логика:
- Принимает `slotIndex` из тела запроса (0–7)
- Проверяет, что слот не занят (`slot_index` уникален на уровне приложения)
- Проверяет, что растение не посажено у этого пользователя
- Убрана последовательная блокировка по `difficulty_level` (нельзя было начать растение N без N-1)
- Сохраняет `slot_index` при создании `UserBioGardenProgress`

## Frontend

### `frontend/src/models/biogarden.ts`

Добавлены интерфейсы:
- `AvailablePlant` — базовые поля растения без прогресса (для пикера)
- `PlantSlot` — `{ slot_index: number, plant: BioGardenPlant | null }`

Обновлён `PlantsListResponse`: теперь `slots` + `available_plants` вместо `plants`.

### `frontend/src/api/index.ts`

`startPlant(telegramId, plantId, slotIndex)` — добавлен параметр `slotIndex`, передаётся в тело запроса.

### `frontend/src/components/game/BioGardenScene.tsx`

- Новые пропсы: `slots: PlantSlot[]`, `selectedSlotIndex: number | null`, `onSlotClick: (slotIndex: number) => void`
- Убраны: `plants`, `selectedPlantId`, `onPlantSelect`, `onPlantHover`, `onPlantHoverEnd`
- Новый компонент `EmptyPot3D`: показывает горшок без растения, надпись «+ Посадить», подсвечивается при hover
- Рендеринг: всегда 8 слотов — занятые → `Plant3D`, пустые → `EmptyPot3D`
- Камера фокусируется по `PLANT_POSITIONS[selectedSlotIndex]`

### `frontend/src/components/game/BioGardenGame.tsx`

Полная переработка стейта:

**Новый стейт:**
- `slots: PlantSlot[]` — 8 слотов
- `availablePlants: AvailablePlant[]` — доступные для посадки
- `selectedSlotIndex: number | null` — вместо `selectedPlant`
- `showPlantPicker: boolean` — показывать ли пикер растений
- `pendingSlotIndex: number | null` — какой горшок ожидает выбора

**Новые обработчики:**
- `handleSlotClick(slotIndex)` — если пустой → открывает пикер, если занятый → выбирает
- `handlePickPlant(plant)` — вызывает `startPlant`, добавляет растение в слот, убирает из `availablePlants`, открывает панель с выбранным растением

**Пикер растений:**
Полноэкранный оверлей (z-index 20) с анимацией появления. Показывает карточки доступных растений: название, научное название, сложность, стадии, темы ЕГЭ, кнопка «Посадить в горшок N».

**HUD:**
- Счётчик `{занято}/8` вместо `{посажено}/{всего}`
- Подсказка внизу меняется в зависимости от того, есть ли уже посаженные растения

**Убрано:**
- Кнопка «Начать выращивать» из панели (растение стартует через пикер)
- Состояния `not_started` и `locked` в `renderGameStatus`
