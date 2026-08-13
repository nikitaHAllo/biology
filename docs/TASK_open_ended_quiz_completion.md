# Задача: Корректное завершение тестов с вопросами 2 части (open_ended)

## Проблемы

### 1. Тест не уходил в «Пройденные»
После прохождения теста, состоящего только из вопросов `open_ended`, он оставался в списке «Новые тесты» навсегда. При повторном открытии студент видел уже сохранённый (и возможно проверенный) ответ, но тест по-прежнему числился непройденным.

**Причина:** В `useQuiz.ts` был добавлен guard `hasScoredQuestions` — `finishQuiz()` не вызывался для тестов без scored-вопросов. Из-за этого запрос `POST /quizzes/:id/complete` никогда не уходил, `UserQuizResult` не создавался, квиз не переходил в «Пройденные».

### 2. Экран результата показывал «0/3 правильных» вместо «Ответы записаны!»
Для теста с одним open_ended вопросом после завершения показывался стандартный экран результата с неверными данными — например, `0 из 3 правильных`, хотя в тесте был только один вопрос и он открытый.

**Причина (race condition):**
1. `next()` → `setIsFinished(true)` + `finishQuiz()` (async)
2. `finishQuiz` → `loadQuizzes()` → `setQuiz(следующийТест)` — `quiz` заменялся на следующий тест (у которого 3 вопроса)
3. React рендерил экран результата: `isFinished = true`, но `quiz` уже другой → вычислял `scoredTotal` по чужому квизу → показывал `0/3`

### 3. Backend: `is_passed = false` для pure open_ended тестов
Даже если бы `finishQuiz()` вызывался, бэкенд считал `isPassed = scoreNum === quiz.total_questions` → `0 === 1` → `false`. Квиз записывался как непройденный, `is_completed = !!result?.is_passed = false`, тест снова оставался в «Новых».

---

## Что сделано

### Backend — `backend/src/api/controllers/quizzes.controller.ts`

В эндпоинте `POST /quizzes/:id/complete` изменён расчёт `isPassed`:

**Было:**
```typescript
const quiz = await Quiz.findByPk(quizIdNum, { raw: true });
const isPassed = scoreNum === quiz.total_questions && quiz.total_questions > 0;
```

**Стало:**
```typescript
const quiz = await Quiz.findByPk(quizIdNum, {
    include: [{ model: QuizQuestion, as: 'questions' }],
});

const questions = (quiz as any).questions as QuizQuestion[] ?? [];
const scoredCount = questions.filter(q => q.question_type !== 'open_ended').length;
// Если все вопросы открытые — автозачёт при любом сабмите
const isPassed = scoredCount === 0
    ? quiz.total_questions > 0
    : scoreNum === scoredCount;
```

Логика `isPassed` теперь учитывает только scored-вопросы. Для теста целиком из `open_ended` — `isPassed = true` автоматически при сабмите.

---

### Frontend — `frontend/src/hooks/quize/useQuiz.ts`

**1. Убран guard `hasScoredQuestions`:**
```typescript
// Было:
if (hasScoredQuestions) {
    finishQuiz();
}

// Стало:
finishQuiz(); // всегда
```

**2. Добавлен `finishSnapshot` — снапшот данных в момент завершения:**
```typescript
const [finishSnapshot, setFinishSnapshot] = useState<{
    scoredTotal: number;
    correct: number;
    earnedCoins: number;
} | null>(null);
```

В функции `next()`, перед вызовом `finishQuiz()`:
```typescript
const openCt = quiz.questions.filter(q => q.question_type === 'open_ended').length;
const scoredTotal = totalQuestions - openCt;
const correct = Object.values(history).filter(h => h.isCorrect).length;
setFinishSnapshot({ scoredTotal, correct, earnedCoins: coins });
setIsFinished(true);
finishQuiz();
```

Снапшот сбрасывается в `resetQuizState()`:
```typescript
setFinishSnapshot(null);
```

Возвращается из хука:
```typescript
return { ..., finishSnapshot };
```

---

### Frontend — `frontend/src/pages/Quiz.tsx`

Экран результата теперь читает данные из `finishSnapshot`, а не вычисляет из `quiz?.questions` (которые могут смениться из-за `loadQuizzes`):

```typescript
if (isFinished && !isViewOnly && finishSnapshot) {
    const { scoredTotal, correct, earnedCoins } = finishSnapshot;

    if (scoredTotal === 0) {
        // Только open_ended — показываем подтверждение
        return <QuizLayout>
            <Card>Ответы записаны! ... <Button onClick={restart}>Просмотреть</Button></Card>
        </QuizLayout>;
    }

    const isPassed = correct === scoredTotal;
    return <QuizLayout>
        <QuizResult correct={correct} total={scoredTotal} coins={earnedCoins} ... />
    </QuizLayout>;
}
```

---

## Изменённые файлы

- `backend/src/api/controllers/quizzes.controller.ts`
- `frontend/src/hooks/quize/useQuiz.ts`
- `frontend/src/pages/Quiz.tsx`

---

## Итоговое поведение

| Тип теста | Результат завершения |
|---|---|
| Только `open_ended` | Экран «Ответы записаны!», тест уходит в «Пройденные» |
| Смешанный (scored + open_ended) | Стандартный `QuizResult` по scored-вопросам, тест уходит в «Пройденные» |
| Только scored | Поведение не изменилось |

После завершения тест корректно переходит из «Новые тесты» в «Пройденные». При повторном открытии из «Пройденных» — режим просмотра без возможности переотправки.
