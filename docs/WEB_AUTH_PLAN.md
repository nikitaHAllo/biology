# План: веб + Telegram, единая таблица `users`

## Цель

Один внутренний `id` для всех пользователей; вход из **Telegram Mini App** по `telegram_id`; вход с **сайта** по **email + пароль**; JWT в **localStorage**; API принимает `Authorization: Bearer` или (legacy) `X-Telegram-Id`.

## Сделано

1. **PostgreSQL** — миграция `migrateUserAuth`: `email`, `password_hash`, `telegram_id` nullable, частичные UNIQUE на `telegram_id` и `lower(trim(email))`.
2. **Модель `User`** — поля `email`, `password_hash`; `telegram_id` опционален.
3. **Backend** — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`; JWT (`JWT_SECRET`, опционально `JWT_EXPIRES_IN`).
4. **Middleware** — сначала Bearer JWT → `req.user`, иначе `X-Telegram-Id`.
5. **Маршруты `/api/users/me/*`** — профиль, статы, курс-прогресс, достижения, баланс, PATCH профиля (все с `authenticateUser`).
6. **Frontend** — `localStorage` (`biology_auth_token`), axios interceptor, страницы `/login`, `/register`, обновлён `useUserData` (веб без Telegram).
7. **Корень `/`** — редирект: без JWT в браузере → `/login`; с JWT или Telegram Mini App (`initData`) → `/home`. Каталог: маршрут **`/home`**.
8. **Подтверждение email** — при регистрации код на почту (6 цифр, 15 мин); `POST /auth/verify-email`, `POST /auth/resend-code`; без SMTP код в **логе сервера**; вход только после `email_verified_at`; старые веб-пользователи помечены подтверждёнными миграцией.

## Дальше (по желанию)

- Выдача JWT после Mini App (Telegram `initData` + verify на сервере), чтобы не слать `telegramId` в query.
- Привязка Telegram ↔ email (одна строка в `users`).
- Refresh-токены, сброс пароля по email.
- Защита от XSS (CSP) при хранении JWT в `localStorage`.
