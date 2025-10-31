# 🧬 Biology EGE Platform

🚀 **Backend + Telegram Bot (TypeScript, Node.js, PostgreSQL, grammY)**  
Платформа для обучения, квизов и заданий 2-й части с экономикой репкоинов и админ-оценкой.

---

## 🛠️ Стек технологий

- **TypeScript**
- **Node.js / Express**
- **PostgreSQL**
- **grammY** (Telegram Bot API)
- **Vite / React (frontend, Mini App)**

---

## ✨ Что нового

### 🧩 API
- Новые маршруты:
  - `/api/courses`, `/api/lessons`, `/api/tasks`, `/api/progress`, `/api/assignments`, `/api/admin`
- Централизованный обработчик ошибок
- Расширен `/api/users` — добавлен `/:telegram_id/profile`
- Новые meta-роуты:
  - `/api/meta/config` — конфиг Mini App (`assignmentPrice`)
  - `/api/meta/bot` — health-чек бота

### ⚙️ Сервисы (features)
- **users.service.ts** — регистрация, профиль, кошелёк (репкоины)  
- **courses.service.ts** — курсы и уроки  
- **tasks.service.ts** — задания викторин, начисление и защита от повторных наград  
- **assignments.service.ts** — задания 2-й части, заявки, списание монет, учёт транзакций  
- Атомарные операции (`FOR UPDATE`), журнал транзакций `wallet_transactions`

### 🗃️ Миграции и сиды
- **`src/db/migrations/000_init.sql`** — создаёт таблицы:
- **Сиды:**
- `001_seed_minimal.sql` — минимальный набор данных
- `002_seed_more.sql` — дополнительные уроки и задания

### 🤖 Telegram-бот (grammY, TypeScript)
- Команды:
- `/start` — Mini App-кнопка (HTTPS) или fallback-ссылка
- `/progress` — краткий статус и баланс
- `/help` — список команд
- Приём `photo/document` с подписью `assignment:<id>`:
- авт-регистрация пользователя  
- проверка баланса и урока  
- списание `ASSIGNMENT_PRICE`  
- создание заявки и уведомление в `ADMIN_CHAT_ID`
- После оценки админом — бот уведомляет пользователя
- Добавлены deeplink-кнопки: *Открыть, Курсы, Прогресс, Задания 2-й части*

---

## ⚙️ Конфигурация

`.env.example`:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/biology
BOT_TOKEN=<your_telegram_bot_token>
FRONTEND_URL=https://your-frontend-url
ADMIN_CHAT_ID=<your_admin_chat_id>
ASSIGNMENT_PRICE=10
