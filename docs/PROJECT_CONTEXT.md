# Biology Learning Platform — PROJECT_CONTEXT.md

## Overview

This project is a **biology learning platform for tutor–student interaction**, originally designed as a **Telegram Mini App**, but currently evolving into a **full web application**.

The platform combines:

- structured learning materials
- quizzes
- downloadable tasks
- gamification modules
- interactive biology mini-games
- student progress tracking
- tutor workflow support (future expansion)

Frontend: React + Mantine + Vite
Backend: Node.js + Express + PostgreSQL + Sequelize
Auth: JWT + Telegram ID fallback auth
Extra: Telegram WebApp SDK integration

---

# Architecture Overview

Project consists of two main parts:

```
frontend/
backend/
```

---

# Frontend Stack

Main technologies:

- React 19
- Vite
- Mantine UI
- React Router v7
- Axios
- Three.js + React Three Fiber
- Framer Motion

Structure logic:

```
src/
 ├── components/
 ├── pages/
 ├── hooks/
 ├── providers/
 ├── contexts/
 ├── models/
 ├── lib/
```

Routing handled in:

```
src/App.tsx
```

Main routes:

```
/home
/profile
/quiz
/mini
/login
/register

/biogarden
/genetics
/virus
```

Fullscreen routes (games):

```
/biogarden
/genetics
/virus
```

These hide Header component.

---

# Telegram Integration

Telegram WebApp SDK is supported but optional.

Provider:

```
TelegramProvider
```

Behavior:

If Telegram user exists:

```
window.Telegram.WebApp.initDataUnsafe.user
```

use Telegram identity.

Else:

fallback dev user:

```
id: 2110078216
```

This allows browser-only development without Telegram runtime.

Telegram theme also controls Mantine theme:

```
light / dark mode sync
```

---

# API Layer (Frontend)

Central API wrapper:

```
src/services/apiService.ts
```

Responsibilities:

- attach JWT automatically
- fallback to telegramId endpoints
- handle 401 auto-logout
- normalize API responses

Pattern:

```
ApiResponse<T>
```

Example:

```
response.data.data.profile
```

Auth storage:

```
lib/authStorage.ts
```

Stores JWT token.

---

# Backend Stack

Main technologies:

- Node.js
- Express
- PostgreSQL
- Sequelize ORM
- JWT auth
- Nodemailer
- Brevo email API
- Telegram bot (grammy)
- node-cron scheduler

Entry point:

```
src/index.ts
```

Server starts even if:

- DB unavailable
- bot unavailable

This improves dev stability.

---

# Backend Folder Structure

```
src/

api/
bot/
cron/
db/
models/
services/
utils/
types/
uploads/
```

---

# Authentication System

Supports **two authentication modes**

### Mode 1 — JWT

Standard email/password:

```
/auth/register
/auth/verify-email
/auth/login
/auth/me
```

Email verification required before login.

Verification code:

```
6-digit
TTL = 15 minutes
```

After verification:

```
+10 coins bonus
```

JWT payload:

```
sub = userId
typ = access
```

---

### Mode 2 — Telegram ID auth

Fallback authentication using header:

```
x-telegram-id
```

Used mainly for:

- Telegram Mini App
- legacy compatibility
- dev shortcuts

Middleware:

```
authenticateUser
optionalAuth
```

---

# Email Verification System

Priority order:

```
Brevo API
SMTP
console fallback
```

Dev-safe behavior:

verification code always printed to console.

---

# Coins Economy System

Internal virtual currency:

```
coins
```

Stored in:

```
users.coins
wallet_transactions
```

Sources:

```
welcome_bonus
email verification
future: quiz rewards
future: purchases
future: tutor rewards
```

---

# Materials System

Catalog endpoint:

```
/materials/catalog
```

Supports:

```
sections
topics
access control
purchases
```

Topic unlock logic:

```
/materials/access/check
/materials/topics/:id/purchase
```

---

# Quiz System

Endpoints:

```
GET /quizzes
GET /quizzes/:id
POST /quizzes/:id/complete
```

Features:

- quiz list
- quiz details
- completion tracking
- scoring logic

---

# Downloadable Tasks

Endpoint:

```
GET /tasks/downloads
```

Supports:

```
collections
bulk download selection
```

Frontend logic handled in:

```
useHomeData()
```

---

# BioGarden Module

Gamified plant-growth learning system.

Endpoints:

```
/biogarden/plants
/biogarden/plants/:id/start
/biogarden/plants/:id/water
/biogarden/plants/:id/revive
/biogarden/plants/:id/progress
/biogarden/progress
/biogarden/stats
/biogarden/ege-readiness
```

Features:

```
plant lifecycle
watering mechanic
revive mechanic
coins usage
cron decay system
exam readiness indicator
```

Cron job:

```
startBiogardenDecayCron()
```

Handles passive plant decay.

---

# Games / Interactive Modules

Routes:

```
/biogarden
/genetics
/virus
```

Modules:

```
BioGardenGame
GeneticCalculator
VirusDetectiveGame
```

Built using:

```
React Three Fiber
Three.js
```

Gamification-first architecture.

---

# Database

ORM:

```
Sequelize
```

Database:

```
PostgreSQL
```

Models include:

```
User
WalletTransaction
materials entities
quiz entities
biogarden entities
```

Seed script:

```
seed:biogarden
```

---

# Event Synchronization (Frontend)

Internal event bus:

```
userDataBus
```

Example event:

```
user:refresh
```

Used to sync:

Home page
Profile page

without global state manager.

---

# CORS Strategy

Allowed origins:

```
localhost
devtunnels
FRONTEND_URL env
```

Configured in:

```
api/server.ts
```

---

# Environment Variables

Backend expected:

```
PORT
JWT_SECRET
JWT_EXPIRES_IN

FRONTEND_URL

SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM

BREVO_API_KEY
BREVO_SENDER_EMAIL
BREVO_SENDER_NAME

BOT_MODE
BOT_WEBHOOK_URL
BOT_SECRET_PATH
```

---

# Project Status

Current stage:

transition from Telegram Mini App → Web Learning Platform

Stable:

auth
materials
quizzes
downloads
biogarden module

Expanding:

tutor workflows
student dashboards
course progression system
analytics

---

# Design Philosophy

Core principles:

```
modular backend services
Telegram compatibility preserved
JWT-first authentication
gamification-driven engagement
AI-friendly architecture
```
