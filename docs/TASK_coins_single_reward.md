# Задача: Монеты за игры выдаются только один раз

## Проблема

За повторное прохождение сценария «Вирусного детектива» и «Генетического калькулятора» начислялись репкоины. Ожидаемое поведение: монеты выдаются только при первом прохождении.

### Причины

**Вирусный детектив** (`virus.controller.ts`):  
Контроллер имел ветку `else if (!wasCompleted)`, которая срабатывала при `existing.is_completed = null` (старые записи в БД, созданные до того, как поле появилось). В таком случае `wasCompleted = null ?? false = false` → `!wasCompleted = true` → монеты выдавались снова.

**Генетический калькулятор** (`genetics.controller.ts`):  
Контроллер использовал только JWT-авторизацию (`(req as any).user?.id`). Пользователи Telegram Mini App (без JWT) получали `401` → результат никогда не сохранялся → каждое прохождение выглядело как первое → монеты начислялись снова и снова. Кроме того, фронтенд не передавал `telegramId` в запросах к genetics-эндпоинтам.

---

## Что сделано

### `backend/src/api/controllers/virus.controller.ts`

Упрощена логика ветвления в `complete`:

**Было:**
```typescript
if (!existing) {
    coinsToAdd = is_passed ? virusCase.coins_reward : 0;
    // create...
} else if (!wasCompleted) {
    coinsToAdd = is_passed ? virusCase.coins_reward : 0;
    // update...
} else {
    // Replay: update score, no coins
    await existing.update({ score, clues_used: totalCh, correct_answers: corrAns });
}
```

**Стало:**
```typescript
if (!existing) {
    // First completion — award coins only if passed
    coinsToAdd = is_passed ? virusCase.coins_reward : 0;
    // create...
} else {
    // Replay — never award coins, just keep the best score
    if (score > Number(existing.score)) {
        await existing.update({ score, clues_used: totalCh, correct_answers: corrAns });
    }
}
```

Правило простое: **запись существует → монеты не выдаются, точка.** Убрана промежуточная ветка `!wasCompleted`, которая могла срабатывать на старых/некорректных данных.

Дополнительно: при повторном прохождении счёт теперь обновляется только если он выше предыдущего (сохраняется лучший результат).

---

### `backend/src/api/controllers/genetics.controller.ts`

**1. Добавлена функция `resolveUser`** (идентична virus.controller.ts):
```typescript
async function resolveUser(req: Request): Promise<User | null> {
    const jwtUser = (req as any).user;
    if (jwtUser?.id) return User.findByPk(jwtUser.id);
    const telegramId = (req.body?.telegramId ?? req.query?.telegramId) as string | undefined;
    if (telegramId) return User.findOne({ where: { telegram_id: Number(telegramId) } });
    return null;
}
```

**2. `list`**: заменён `const userId = (req as any).user?.id` на `resolveUser(req)` — теперь список сценариев со статусом прохождения корректно возвращается и для Telegram-пользователей.

**3. `complete`**: 
- Заменена JWT-only авторизация на `resolveUser(req)`
- Упрощена логика: `!existing` → монеты; `else` → без монет, обновить лучший счёт
- Удалена ветка `else if (!existing.is_completed)` по той же причине, что в virus
- Убран лишний `User.findByPk(userId)` внутри блока начисления монет (уже есть `user` от `resolveUser`)

---

### `frontend/src/api/index.ts`

`getGeneticScenarios` и `completeGeneticScenario` дополнены опциональным параметром `telegramId`:

```typescript
async getGeneticScenarios(telegramId?: number): Promise<...> {
    const params = telegramId ? { telegramId } : {};
    const response = await this.api.get("/genetics/scenarios", { params });
    ...
}

async completeGeneticScenario(id: number, score: number, telegramId?: number): Promise<...> {
    const response = await this.api.post(`/genetics/scenarios/${id}/complete`, {
        score,
        ...(telegramId && { telegramId }),
    });
    ...
}
```

---

### `frontend/src/components/game/GeneticsGame.tsx`

- Добавлен импорт `useTelegram`
- Получение `tgUser` и сохранение `telegramId` в `ref` (как в `VirusGame`):
```tsx
const { user: tgUser } = useTelegram();
const telegramIdRef = useRef<number | undefined>(undefined);
useEffect(() => {
    if (tgUser?.id) telegramIdRef.current = Number(tgUser.id);
}, [tgUser]);
```
- `loadScenarios()`: передаёт `telegramIdRef.current`
- `finishGame()`: передаёт `telegramIdRef.current` в `completeGeneticScenario`

---

## Изменённые файлы

- `backend/src/api/controllers/virus.controller.ts`
- `backend/src/api/controllers/genetics.controller.ts`
- `frontend/src/api/index.ts`
- `frontend/src/components/game/GeneticsGame.tsx`

---

## Поведение после исправления

| Ситуация | До | После |
|---|---|---|
| Первое прохождение вируса | Монеты ✓ | Монеты ✓ |
| Повторное прохождение вируса (старая запись с `is_completed = null`) | Монеты ✗ (баг) | Без монет ✓ |
| Повторное прохождение вируса | Без монет ✓ | Без монет ✓ |
| Первое прохождение генетики (Telegram Mini App) | Монеты не давались — 401 ✗ | Монеты ✓ |
| Повторное прохождение генетики (Telegram Mini App) | Монеты ✗ (баг — каждый раз 401, каждый раз «первый раз») | Без монет ✓ |
| Повторное прохождение генетики (JWT) | Без монет ✓ | Без монет ✓ |
