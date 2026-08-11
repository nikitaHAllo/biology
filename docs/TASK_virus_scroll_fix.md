# Задача: Прокрутка и навигация в Вирусном детективе

## Проблема

При большом объёме текста главы пользователь не мог увидеть кнопку «Следующая глава» и перейти дальше. Страница была заблокирована от прокрутки.

## Причина

В `frontend/src/App.tsx` все маршруты из `FULLSCREEN_ROUTES` получали стиль `height: 100dvh; overflow: hidden`. Маршрут `/virus` попал в этот список, что полностью заблокировало вертикальную прокрутку.

## Исправления

### `frontend/src/App.tsx`

Разделены два понятия:
- `HEADER_HIDDEN_ROUTES` — маршруты без шапки: `/biogarden`, `/genetics`, `/virus`, `/login`, `/register`.
- `OVERFLOW_LOCKED_ROUTES` — маршруты с заблокированным overflow (сложный game-UI со своим скроллом): `/biogarden`, `/genetics`.

Контейнер `.app` теперь получает `overflow: hidden` только для BioGarden и Genetics. Для `/virus` стоит `overflow: auto` — страница нормально прокручивается.

### `frontend/src/components/game/VirusGame.tsx`

Добавлен `nextBtnRef` (useRef) на div кнопки «Следующая глава». После того как пользователь выбирает ответ, через 120 мс вызывается `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` — кнопка автоматически выезжает в видимую область экрана.
