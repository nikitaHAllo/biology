# Вирусный детектив — Implementation Notes

## Overview

Реализована игра "Вирусный детектив" по механике "Устранение подозреваемых" (Вариант Б):
- Показывается список из 4–6 патогенов-подозреваемых
- Улики (симптомы, лабораторные данные, наблюдения) открываются по одной
- После каждой улики можно поставить диагноз
- Неверный выбор: патоген вычёркивается, расследование продолжается
- Чем меньше улик использовано — тем выше счёт

## Scoring

```
score = max(10, round((total_clues - clues_used) / total_clues * 100))
```

Монеты: `coins_reward` при первом прохождении, 0 при повторном (если уже завершён).

## Backend

### Новые модели (`backend/src/models/Virus.ts`)

| Модель | Таблица | Ключевые поля |
|---|---|---|
| `VirusCase` | `virus_cases` | title, description, patient_info, difficulty ENUM, coins_reward, order_index, is_active |
| `VirusClue` | `virus_clues` | case_id FK, order_index, clue_text, clue_type ENUM(symptom/lab/observation) |
| `VirusSuspect` | `virus_suspects` | case_id FK, name, description, is_correct, order_index |
| `VirusResult` | `virus_results` | user_id FK, case_id FK, score, clues_used, coins_earned, is_completed, completed_at |

Ассоциации зарегистрированы в `models/index.ts`.

### API Routes (`/api/virus/`)

- `GET /cases` — список активных случаев (с `is_completed`/`score` для авторизованных через `optionalAuth`)
- `GET /cases/:id` — случай с уликами и подозреваемыми (is_correct **скрыт** от фронтенда)
- `POST /cases/:id/guess` — проверка подозреваемого: возвращает `is_correct` + `description`
- `POST /cases/:id/complete` — фиксирует результат, payload: `{ clues_used: number }`

### Admin Routes (`/api/admin/virus/`)

Полный CRUD для случаев, улик и подозреваемых:
- `GET/POST /virus/cases`
- `GET/PUT/DELETE /virus/cases/:id`
- `POST /virus/cases/:caseId/clues`
- `PUT/DELETE /virus/clues/:id`
- `POST /virus/cases/:caseId/suspects`
- `PUT/DELETE /virus/suspects/:id`

## Frontend Game (`frontend/src/components/game/VirusGame.tsx`)

### Экраны
1. **CaseList** — карточки случаев с бейджами сложности, монет и статуса
2. **PlayScreen** — двухколоночный layout:
   - **Левая колонка**: карточка пациента + лента улик с progress bar + кнопка "Следующая улика"
   - **Правая колонка**: карточки подозреваемых
3. Победный баннер прямо на PlayScreen (не отдельный экран)

### Механика
- Кнопка открывает улики по одной (каждый клик = +1 reveal)
- Клик на подозреваемого → `POST /virus/cases/:id/guess`
- Правильно → вызывает `complete`, показывает победный баннер с счётом и монетами
- Неправильно → карточка трясётся (CSS `vShake`), помечается "Не то!", затем "Исключён"
- Если остался один подозреваемый — подсказка "Остался один — назови его!"

### CSS-анимации (inject в head)
- `vSlideIn` — появление новой улики
- `vShake` — неверный ответ
- `vPop` — появление победного баннера

## Admin Editor (`ADMIN/src/pages/VirusPage.tsx`)

- Таблица случаев → клик → детальный вид
- Inline-формы для создания/редактирования: случая, улик, подозреваемых
- Улики: цветовой код по типу (красный=симптом, синий=лаб, фиолетовый=наблюдение)
- Подозреваемые: зелёный фон = правильный ответ, фиолетовый = ложный
- Чёткая метка "ПРАВИЛЬНЫЙ ОТВЕТ" в карточке подозреваемого

## Изменённые файлы

- `backend/src/models/Virus.ts` — новый
- `backend/src/models/index.ts` — добавлены virus импорты + ассоциации
- `backend/src/api/controllers/virus.controller.ts` — новый
- `backend/src/api/routes/virus.routes.ts` — новый
- `backend/src/api/routes/index.ts` — подключён virus router
- `backend/src/api/controllers/admin.controller.ts` — добавлен virus CRUD
- `backend/src/api/routes/admin.routes.ts` — добавлены virus admin маршруты
- `frontend/src/models/virus.ts` — новый (TypeScript интерфейсы)
- `frontend/src/api/index.ts` — добавлены 4 virus API метода
- `frontend/src/components/game/VirusGame.tsx` — новый компонент игры
- `frontend/src/pages/MiniApp.tsx` — подключён VirusGame
- `ADMIN/src/api.ts` — добавлены `AdminVirusCase/Clue/Suspect` + 11 API методов
- `ADMIN/src/pages/VirusPage.tsx` — новый редактор
- `ADMIN/src/App.tsx` — добавлен пункт "🦠 Вирусный детектив"
