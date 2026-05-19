# Задача: Детальная статистика пользователя в админке

## Что сделано

При клике на пользователя в таблице `/admin → Пользователи` открывается боковая панель с полной картиной обучения: тесты, Биосад, Генетический калькулятор, Детектив-вирусолог.

## Изменений в БД нет

Все нужные таблицы уже существовали (`user_quiz_results`, `user_bio_garden_progress`, `genetic_results`, `virus_results`). Новый эндпоинт только читает данные.

---

## Backend

### `backend/src/api/controllers/admin.controller.ts`

Добавлены импорты: `UserQuizResult`, `UserBioGardenProgress`, `GeneticResult`, `VirusResult`.

Новый метод `getUserStats(req, res)`:
- Параллельно (`Promise.all`) загружает 4 источника данных для пользователя:
  - `UserQuizResult` + join `Quiz` (название теста, total_questions)
  - `UserBioGardenProgress` + join `BioGardenPlant` (название растения)
  - `GeneticResult` + join `GeneticScenario` (название сценария)
  - `VirusResult` + join `VirusCase` (название дела)
- Возвращает: `{ user, quiz_results, garden_progress, genetic_results, virus_results }`

### `backend/src/api/routes/admin.routes.ts`

```typescript
router.get('/users/:id/stats', adminAuth, (req, res) => adminController.getUserStats(req, res));
```

---

## Admin

### `ADMIN/src/api.ts`

Добавлены интерфейсы:
- `AdminUserQuizResult` — id, quiz_title, total_questions, score, is_passed, earned_coins, submitted_at
- `AdminUserGardenProgress` — id, plant_name, current_stage, experience_points, is_completed, is_wilted, planted_at, completed_at
- `AdminUserGeneticResult` — id, scenario_title, score, is_completed, coins_earned, completed_at
- `AdminUserVirusResult` — id, case_title, score, is_completed, coins_earned, clues_used, completed_at
- `AdminUserStats` — объединяет все четыре + user

Добавлен метод:
```typescript
getUserStats: (id: number) => req<AdminUserStats>('GET', `/users/${id}/stats`)
```

### `ADMIN/src/pages/UsersPage.tsx`

- Строки таблицы кликабельны; выбранная строка подсвечивается
- При клике открывается `UserStatsPanel` — фиксированная боковая панель (700px) с затемнённым фоном
- Закрывается по кнопке ✕ или клику на фон

**Содержимое панели:**
- Карточка пользователя: имя/email, Telegram ID, монеты, дата регистрации
- Сводные бейджи: тестов сдано / всего попыток / растений вырастил / посажено / генетик / вирусов
- Таблица тестов: название, счёт X/Y, ✓ Сдан / ✗ Не сдан, монеты, дата
- Таблица Биосада: растение, стадия, XP, статус (✓ Вырос / ✗ Завял / ⏳ Растёт), даты
- Таблица генетики: сценарий, счёт, монеты, статус, дата
- Таблица вирусологии: дело, счёт, улик использовано, монеты, статус, дата
