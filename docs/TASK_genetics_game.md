# Genetics Game — Implementation Notes

## Overview

Implemented the "Генетический калькулятор" game module as a linear step-flow game with an admin visual editor.

## Backend

### New Models (`backend/src/models/Genetics.ts`)

| Model | Table | Key Fields |
|---|---|---|
| `GeneticScenario` | `genetic_scenarios` | title, description, difficulty ENUM, coins_reward, is_active, order_index |
| `GeneticStep` | `genetic_steps` | scenario_id FK, order_index, step_type ENUM(info/question/result), title, content, points, explanation |
| `GeneticOption` | `genetic_options` | step_id FK, option_text, is_correct, feedback, order_index |
| `GeneticResult` | `genetic_results` | user_id FK, scenario_id FK, score, coins_earned, is_completed, completed_at |

Associations registered in `models/index.ts`.

### API Routes (`/api/genetics/`)

- `GET /scenarios` — list all active scenarios (with `is_completed`/`score` for authenticated users via `optionalAuth`)
- `GET /scenarios/:id` — scenario with all steps and options
- `POST /scenarios/:id/complete` — record score; award `coins_reward` on first/incomplete completion, 0 if already completed

### Admin Routes (`/api/admin/genetics/`)

Full CRUD for scenarios, steps, and options:
- `GET/POST /genetics/scenarios`
- `GET/PUT/DELETE /genetics/scenarios/:id`
- `POST /genetics/scenarios/:scenarioId/steps`
- `PUT/DELETE /genetics/steps/:id`
- `POST /genetics/steps/:stepId/options`
- `PUT/DELETE /genetics/options/:id`

## Frontend Game (`frontend/src/components/game/GeneticsGame.tsx`)

### Flow
1. **ScenarioList** — cards with difficulty badge, coins reward, completion status
2. **PlayScreen** — linear step progression; steps render top-down as user advances
3. **ResultScreen** — final score + coins earned

### Step Types
- **info** — text content + "Далее" button
- **question** — answer options; correct → green highlight + advance; wrong → red shake animation + feedback text + allow retry
- **result** — closing card, triggers score submission

### Coin Logic
- First completion or previously incomplete: award `coins_reward`
- Already completed: 0 coins (score update only)

## Admin Editor (`ADMIN/src/pages/GeneticsPage.tsx`)

Visual flowchart-style step editor:
- Scenario list table → click to open detail view
- Steps displayed as vertical cards connected by `│↓` CSS arrows
- Color coding: blue = info, purple = question, green = result
- Up/down reorder buttons (swaps `order_index` values)
- Inline create/edit/delete for steps and answer options
- Option rows show ✓ (correct) / ✗ (incorrect) circle indicators
- All data managed through admin, no seed data

## Files Changed

- `backend/src/models/Genetics.ts` — new
- `backend/src/models/index.ts` — added genetics imports + associations
- `backend/src/api/controllers/genetics.controller.ts` — new
- `backend/src/api/routes/genetics.routes.ts` — new
- `backend/src/api/routes/index.ts` — mounted genetics router
- `backend/src/api/controllers/admin.controller.ts` — added genetics CRUD
- `backend/src/api/routes/admin.routes.ts` — added genetics admin routes
- `frontend/src/models/genetics.ts` — new TypeScript interfaces
- `frontend/src/api/index.ts` — added 3 genetics API methods
- `frontend/src/components/game/GeneticsGame.tsx` — new game component
- `frontend/src/pages/MiniApp.tsx` — wired `GeneticCalculator` to `GeneticsGame`
- `ADMIN/src/api.ts` — added `AdminGeneticScenario/Step/Option` interfaces + 11 API methods
- `ADMIN/src/pages/GeneticsPage.tsx` — new visual editor
- `ADMIN/src/App.tsx` — added "🧬 Генетика" nav item
