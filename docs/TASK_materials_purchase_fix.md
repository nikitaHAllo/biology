# Задача: Исправление покупки контента для web-пользователей

## Проблема

На странице `/home` в разделе «Каталог материалов» покупка темы не сохранялась в базе данных для web-пользователей (авторизованных через JWT):

1. Визуально монеты списывались (оптимистичный UI-апдейт), но после перезагрузки страницы баланс возвращался к исходному значению.
2. В БД монеты не списывались, запись в `user_material_accesses` не создавалась.
3. Баланс монет на странице не отображался вовсе.

### Причины

| # | Место | Причина |
|---|---|---|
| 1 | `TopicCard.tsx:48` | `if (!telegramId) return` — у web-пользователей `user` из Telegram-хука равен `null`, покупка молча прерывалась |
| 2 | `materials.routes.ts` | Нет `optionalAuth` → JWT в заголовке игнорировался, `req.user` всегда `undefined` |
| 3 | `materials.controller.ts` | `purchaseTopic` требовал `telegramId` в теле запроса и возвращал 400 при его отсутствии |
| 4 | `MaterialsSection.tsx:29` | `if (!user?.id) return` — для web-пользователей баланс никогда не загружался |

---

## Что изменено

### Backend: `backend/src/api/routes/materials.routes.ts`

Добавлен `optionalAuth` ко всем трём маршрутам:
```typescript
router.get('/catalog', optionalAuth, ...);
router.post('/topics/:topicId/purchase', optionalAuth, ...);
router.get('/access/check', optionalAuth, ...);
```

### Backend: `backend/src/api/controllers/materials.controller.ts`

**Добавлен `resolveUser(req)`** (тот же паттерн, что в `quizzes.controller.ts`):
```typescript
private async resolveUser(req: Request): Promise<User | null> {
    if (req.user) return req.user;  // JWT
    const telegramId = (req.query.telegramId ?? req.body?.telegramId) as string | undefined;
    if (!telegramId) return null;
    const tgNum = Number(telegramId);
    if (!Number.isInteger(tgNum) || tgNum <= 0) return null;
    return User.findOne({ where: { telegram_id: tgNum } });
}
```

**Рефакторинг `getCatalog`, `purchaseTopic`, `checkTopicAccess`** — везде используется `resolveUser` вместо прямого поиска по `telegramId` из query/body.

**`purchaseTopic`**: при отсутствии пользователя возвращает 401, а не 400; удалена автоматическая регистрация незнакомого telegramId (и импорт `usersService`).

### Frontend: `frontend/src/api/index.ts`

```typescript
// getUserBalance — telegramId теперь опциональный
async getUserBalance(telegramId?: number): Promise<number> {
    const path = getAuthToken()
        ? '/users/me/balance'
        : `/users/${telegramId}/balance`;
    ...
}

// purchaseTopic — telegramId опциональный, в тело запроса отправляется только если задан
async purchaseTopic(telegramId: number | undefined, topicId: number): Promise<PurchaseTopicResult> {
    const body = telegramId ? { telegramId } : {};
    ...
}
```

### Frontend: `frontend/src/hooks/home/useTopicPurchase.ts`

Параметр `telegramId` в `purchaseTopic` изменён с `number` на `number | undefined`.

### Frontend: `frontend/src/components/home/TopicCard.tsx`

Удалён guard, блокировавший web-пользователей:
```typescript
// было:
if (!telegramId) { return; }
// стало: guard удалён, покупка проходит через JWT
```

### Frontend: `frontend/src/components/home/MaterialsSection.tsx`

Импортирован `getAuthToken`; `loadUserBalance` теперь загружает баланс при наличии JWT даже без Telegram-пользователя:
```typescript
// было:
if (!user?.id) return;
// стало:
if (!user?.id && !getAuthToken()) return;
const balance = await apiService.getUserBalance(user?.id);
```

## Изменений в БД нет

Все нужные таблицы (`user_material_accesses`, `wallet_transactions`) уже существуют.
