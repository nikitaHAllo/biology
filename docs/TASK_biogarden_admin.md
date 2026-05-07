# Задача: Управление Биосадовником через админку

## Цель
Убрать захардкоженные seed-данные из игры «Биосадовник» и перевести управление растениями (описания, изображения, вопросы) в административную панель.

## Что было сделано

### Backend

**`backend/src/db/seedBiogarden.ts`** — очищен: функция `seedBioGardenData()` оставлена пустой, seed-данные удалены.

**`backend/src/db/seeds.ts`** — аналогично очищен.

**`backend/src/api/controllers/admin.controller.ts`** — добавлены 11 методов CRUD:
- `getBioGardenPlants` — список растений с количеством вопросов
- `getBioGardenPlant` — полная карточка растения (с вопросами и вариантами ответов)
- `createBioGardenPlant` — создание растения (принимает `biology_topics` как массив или строку через запятую)
- `updateBioGardenPlant` — редактирование
- `deleteBioGardenPlant` — удаление
- `createBioGardenQuestion` / `updateBioGardenQuestion` / `deleteBioGardenQuestion`
- `createBioGardenOption` / `updateBioGardenOption` / `deleteBioGardenOption`

**`backend/src/api/routes/admin.routes.ts`** — добавлены маршруты:
```
GET    /admin/biogarden/plants
GET    /admin/biogarden/plants/:id
POST   /admin/biogarden/plants
PUT    /admin/biogarden/plants/:id
DELETE /admin/biogarden/plants/:id

POST   /admin/biogarden/plants/:plantId/questions
PUT    /admin/biogarden/questions/:id
DELETE /admin/biogarden/questions/:id

POST   /admin/biogarden/questions/:questionId/options
PUT    /admin/biogarden/options/:id
DELETE /admin/biogarden/options/:id
```

### Admin Panel

**`ADMIN/src/api.ts`** — добавлены интерфейсы `AdminBioGardenOption`, `AdminBioGardenQuestion`, `AdminBioGardenPlant` и 11 методов API.

**`ADMIN/src/pages/BioGardenPage.tsx`** — новая страница управления:
- Таблица растений с миниатюрой изображения, количеством вопросов (красный бейдж если 0), статусом активности
- `PlantForm` — создание/редактирование растения: название, научное название, описание (с форматированием `Заголовок:` / `- пункт`), `image_url` с живым превью, `biology_topics` через запятую, уровень сложности, стадии роста, опыт, is_active
- `QuestionForm` — создание/редактирование вопроса: текст, объяснение, тема ЕГЭ, код ЕГЭ, баллы, сложность, таймер, is_active
- `OptionRow` — inline-редактирование варианта ответа с чекбоксом is_correct
- `PlantDetail` — раскрываемая карточка с вопросами и вариантами ответов

**`ADMIN/src/App.tsx`** — добавлена навигация «🌱 Биосадовник» и рендер `<BioGardenPage />`.

### Frontend

**`frontend/src/components/game/BioGardenGame.tsx`** — удалены:
- `MOCK_PLANTS` — массив из 8 захардкоженных растений
- `EXTENDED_PLANT_DESCRIPTIONS` — блоки описаний по ID
- `EXTENDED_PLANT_DESCRIPTIONS_BY_SCI` — маппинг научных названий → описания
- `PLANT_IMAGE_BY_SCI` — маппинг научных названий → пути к изображениям

Теперь:
- `useState<BioGardenPlant[]>([])` — стартует с пустым массивом
- При ошибке/оффлайн — показывает пустой сад с бейджем «⚠ сервер недоступен»
- `activePlantDescription` = `activePlant.description` из API
- `activePlantImageUrl` = `activePlant.image_url` из API

## Формат описания растения

Поле `description` поддерживает простое форматирование, которое рендерится во фронтенде:
- Строка оканчивающаяся на `:` → заголовок (бирюзовый)
- Строка начинающаяся с `- ` → маркированный пункт
- Пустая строка → отступ
- Остальное → обычный абзац

## Изображения растений

Статика хранится в `frontend/public/plants/`. При создании растения в админке в поле `image_url` указывается путь вида `/plants/pisum-sativum.png`. Поле поддерживает live-превью прямо в форме.

---

## Исправление: авторизация биосадовника для web-пользователей

### Проблема
Web-пользователи (email/password) получали `{"success":false,"message":"Пользователь не найден"}` при открытии биосадовника, потому что контроллер искал пользователя только по `telegram_id` из query-параметра, а у web-пользователей его нет.

### Решение

**`backend/src/api/routes/biogarden.routes.ts`** — ко всем 12 роутам добавлен `optionalAuth` middleware. Он читает JWT из заголовка `Authorization: Bearer ...` и кладёт пользователя в `req.user`, если токен валиден. Если токена нет — просто пропускает запрос дальше.

**`backend/src/api/controllers/biogarden.controller.ts`** — добавлен приватный метод `resolveUser(req)`:
```typescript
private async resolveUser(req: Request): Promise<User | null> {
    if (req.user) return req.user;  // web: JWT
    const telegramId = (req.query.telegramId ?? req.body?.telegramId) as string | undefined;
    if (!telegramId) return null;
    return User.findOne({ where: { telegram_id: Number(telegramId) } });  // telegram: fallback
}
```
Все 11 методов контроллера заменили `User.findOne({ where: { telegram_id } })` на `this.resolveUser(req)`.

**`backend/src/api/controllers/biogarden-readiness.controller.ts`** — аналогичная правка.

**`frontend/src/api/index.ts`** — `getPlantsList` больше не передаёт `telegramId` в параметрах если его нет (JWT в заголовке достаточен).

**`frontend/src/components/game/BioGardenGame.tsx`** — убран guard `if (!telegramId)` который раньше блокировал запрос для web-пользователей.

### Как работает теперь
| Тип пользователя | Механизм |
|---|---|
| Web (email/password) | axios добавляет `Authorization: Bearer <token>` → `optionalAuth` → `req.user` → `resolveUser` возвращает его |
| Telegram Mini App | Нет JWT, `telegramId` в query/body → `req.user` пуст → fallback на `telegramId` |

---

## Игровой цикл в нижней панели

### Проблема
Вся игровая логика была реализована на бэкенде (стадии роста, HP, вопросы, combo), но в интерфейсе не вызывалась. При нажатии на растение показывалось только описание и фото — без возможности играть.

### Что изменено

**`frontend/src/models/biogarden.ts`** — добавлены типы:
- `BioGardenQuestionOption` — вариант ответа (id, option_text, order_index)
- `BioGardenQuestion` — вопрос с массивом options
- `CurrentQuestionResponse` — ответ GET `/current-question`
- `SubmitAnswerResponse` — ответ POST `/answer` (is_correct, earned_experience, combo_count, progress, animation)
- `ReviveQuestionResponse` — ответ GET `/revive-question`
- `ReviveAnswerResponse` — ответ POST `/revive-answer` (is_correct, revived, revive_sleep_until)
- `AnswerProgressUpdate` — обновление прогресса внутри ответа

**`frontend/src/api/index.ts`** — добавлены методы:
```typescript
getCurrentQuestion(plantId, telegramId?)
submitBiogardenAnswer(plantId, questionId, answerId, telegramId?)
getBiogardenReviveQuestion(plantId, telegramId?)
submitReviveAnswer(plantId, questionId, answerId, telegramId?)
```

**`frontend/src/components/game/BioGardenGame.tsx`** — полная реализация игрового цикла:

#### Режимы нижней панели (`PanelMode`)

| Режим | Содержимое |
|---|---|
| `info` | Игровой статус + описание + озвучка + фото |
| `question` | Текст вопроса + кнопки А/Б/В/Г |
| `result` | Результат (✅/❌) + XP/монеты + объяснение + HP бар |

#### Состояния растения (`PlantGameState`)

| Состояние | Условие | Действие |
|---|---|---|
| `locked` | `planted_at === null && !is_unlocked` | 🔒 Подсказка про предыдущее растение |
| `not_started` | `planted_at === null && is_unlocked` | 🌱 Кнопка «Начать выращивать» |
| `active` | Есть прогресс, не завяло, не завершено | ❓ «Ответить на вопрос» + 💧 «Полить (10 🪙)» |
| `wilted` | `is_wilted === true`, не в спячке | 🔄 «Реанимировать (вопрос)» + 💰 «50 🪙» |
| `sleeping` | `revive_sleep_until > now` | 😴 Время пробуждения |
| `completed` | `is_completed === true` | ✅ «Выращено полностью» |

#### HP и прогресс (info режим)
Отображаются только если растение начато (`planted_at !== null`):
- HP бар с цветовым кодированием: зелёный ≥80%, жёлтый ≥50%, оранжевый ≥20%, красный <20%
- Стадия роста: прогресс-бар + текст «Стадия X/Y»

#### Обновление состояния без перезагрузки
Метод `updatePlantInState(plantId, updates)` синхронно обновляет массив `plants[]` и `selectedPlant` — изменения видны сразу, без повторного запроса к серверу.

#### Изменения баланса
- Правильный ответ: `setUserCoins(prev => prev + earned_coins)`, `setTotalExperience(prev => prev + earned_experience)`
- Полив: `setUserCoins(prev => prev - 10)`
- Реанимация монетами: `setUserCoins(prev => prev - 50)`

### Изменения в БД
**Нет.** Все таблицы уже существуют: `UserBioGardenProgress`, `UserBioGardenAttempt`, `UserTopicMastery`, `WalletTransaction`.

### Как тестировать
1. Зайти в Биосадовник, выбрать растение
2. Первое разблокированное растение (difficulty_level = 1 с required_experience = 0) → кнопка «Начать выращивать»
3. После старта → HP 60/100, Стадия 2, кнопка «Ответить на вопрос»
4. Ответить правильно → XP + монеты + анимация стадии при HP ≥ 80
5. Ответить неверно несколько раз → HP падает; при 0 → кнопки реанимации
