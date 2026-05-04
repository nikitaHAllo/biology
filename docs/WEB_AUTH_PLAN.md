# Auth: веб + Telegram, единая таблица `users`

## Цель

Один внутренний `id` для всех пользователей; вход из **Telegram Mini App** по `telegram_id`; вход с **сайта** по **email + пароль**; JWT в **localStorage**; API принимает `Authorization: Bearer` или (legacy) `X-Telegram-Id`.

## Реализовано

1. **PostgreSQL** — миграция `migrateUserAuth`: `email`, `password_hash`, `telegram_id` nullable, частичные UNIQUE на `telegram_id` и `lower(trim(email))`.
2. **Модель `User`** — поля `email`, `password_hash`; `telegram_id` опционален.
3. **Backend** — `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`; JWT (`JWT_SECRET`, `JWT_REFRESH_SECRET`).
4. **Middleware** — сначала Bearer JWT → `req.user`, иначе `X-Telegram-Id`.
5. **Маршруты `/api/users/me/*`** — профиль, статы, курс-прогресс, достижения, баланс, PATCH профиля (все с `authenticateUser`).
6. **Frontend** — `localStorage` (`biology_auth_token`, `biology_refresh_token`), axios interceptor (attach + auto-refresh на 401), страницы `/login`, `/register`.
7. **Корень `/`** — редирект: без JWT в браузере → `/login`; с JWT или Telegram Mini App (`initData`) → `/home`.

## Схема токенов

| Токен | Время жизни | Ключ хранения | Env переменная |
|---|---|---|---|
| Access | 15 минут | `biology_auth_token` | `JWT_SECRET` |
| Refresh | 30 дней | `biology_refresh_token` | `JWT_REFRESH_SECRET` (или `JWT_SECRET`) |

**Флоу обновления:**
1. Access token истёк → axios interceptor перехватывает 401
2. Interceptor вызывает `POST /auth/refresh` с `refreshToken`
3. Получает новую пару токенов, повторяет исходный запрос
4. Если refresh тоже невалиден → `clearAuthToken()` + редирект на `/login`

## Регистрация и вход

```
POST /auth/register  { email, password, username? }
→ 201 { accessToken, refreshToken, user }

POST /auth/login     { email, password }
→ 200 { accessToken, refreshToken, user }

POST /auth/refresh   { refreshToken }
→ 200 { accessToken, refreshToken }

GET  /auth/me        (Bearer required)
→ 200 { user }
```

## Дальше (по желанию)

- Выдача JWT после Mini App (Telegram `initData` + verify на сервере), чтобы не слать `telegramId` в query.
- Привязка Telegram ↔ email (одна строка в `users`).
- Сброс пароля по email.
- Хранение refresh токена в БД (инвалидация при логауте / смене пароля).
- Защита от XSS (CSP) при хранении JWT в `localStorage`.
