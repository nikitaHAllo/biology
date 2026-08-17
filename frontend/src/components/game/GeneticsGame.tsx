import React, { useState, useEffect, useRef } from "react";
import { apiService } from "../../api";
import { useTelegram } from "../../hooks";
import type {
  GeneticScenario,
  GeneticStep,
  GeneticOption,
} from "../../models/genetics";

// ── CSS injected once ─────────────────────────────────────────────────────────
const CSS = `
@keyframes gSlideIn {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes gShake {
  0%,100% { transform: translateX(0); }
  20%,60% { transform: translateX(-6px); }
  40%,80% { transform: translateX(6px); }
}
.g-card { animation: gSlideIn 0.35s ease; }
.g-shake { animation: gShake 0.4s ease; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const DIFF_LABEL: Record<string, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};
const DIFF_COLOR: Record<string, string> = {
  easy: "#27ae60",
  medium: "#f39c12",
  hard: "#e74c3c",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Screen = "list" | "play" | "result";

interface PlayState {
  scenario: GeneticScenario;
  steps: GeneticStep[];
  currentIndex: number; // index of the current active step
  score: number;
  answeredIds: Set<number>; // step ids answered correctly
  feedback: { optionId: number; text: string; correct: boolean } | null;
  pendingAdvance: boolean; // correct answer chosen, waiting for "Далее"
}

// ── Root component ────────────────────────────────────────────────────────────
export const GeneticsGame: React.FC = () => {
  const { user: tgUser } = useTelegram();
  const telegramIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (tgUser?.id) telegramIdRef.current = Number(tgUser.id);
  }, [tgUser]);

  const [screen, setScreen] = useState<Screen>("list");
  const [scenarios, setScenarios] = useState<GeneticScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [play, setPlay] = useState<PlayState | null>(null);
  const [resultData, setResultData] = useState<{
    score: number;
    coins: number;
    title: string;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    if (screen === "play") {
      setTimeout(
        () =>
          bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          }),
        100,
      );
    }
  }, [play?.currentIndex, screen]);

  async function loadScenarios() {
    setLoading(true);
    try {
      const data = await apiService.getGeneticScenarios(telegramIdRef.current);
      setScenarios(data.scenarios);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function startScenario(id: number) {
    setLoading(true);
    try {
      const data = await apiService.getGeneticScenario(id);
      const steps = data.scenario.steps ?? [];
      setPlay({
        scenario: data.scenario,
        steps,
        currentIndex: 0,
        score: 0,
        answeredIds: new Set(),
        feedback: null,
        pendingAdvance: false,
      });
      setScreen("play");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function advance() {
    if (!play) return;
    const next = play.currentIndex + 1;
    if (next >= play.steps.length) {
      finishGame();
      return;
    }
    setPlay((p) =>
      p
        ? { ...p, currentIndex: next, feedback: null, pendingAdvance: false }
        : p,
    );
  }

  function selectOption(option: GeneticOption, step: GeneticStep) {
    if (!play || play.pendingAdvance || play.answeredIds.has(step.id)) return;

    if (option.is_correct) {
      setPlay((p) => {
        if (!p) return p;
        const answeredIds = new Set(p.answeredIds);
        answeredIds.add(step.id);
        return {
          ...p,
          score: p.score + step.points,
          answeredIds,
          feedback: {
            optionId: option.id,
            text: step.explanation ?? "Верно!",
            correct: true,
          },
          pendingAdvance: true,
        };
      });
    } else {
      setPlay((p) =>
        p
          ? {
              ...p,
              feedback: {
                optionId: option.id,
                text: option.feedback ?? "Неверно, попробуй ещё раз.",
                correct: false,
              },
            }
          : p,
      );
    }
  }

  async function finishGame() {
    if (!play) return;
    const { score, scenario } = play;
    setResultData({ score, coins: 0, title: scenario.title });
    setScreen("result");
    try {
      const res = await apiService.completeGeneticScenario(scenario.id, score, telegramIdRef.current);
      setResultData((d) => (d ? { ...d, coins: res.coins_earned } : d));
      await loadScenarios();
    } catch {
      // silent
    }
  }

  function backToList() {
    setScreen("list");
    setPlay(null);
    setResultData(null);
  }

  // ── Renders ───────────────────────────────────────────────────────────────
  if (screen === "list") {
    return (
      <ScenarioList
        scenarios={scenarios}
        loading={loading}
        onSelect={startScenario}
      />
    );
  }
  if (screen === "result" && resultData) {
    return (
      <ResultScreen
        title={resultData.title}
        score={resultData.score}
        coins={resultData.coins}
        onBack={backToList}
      />
    );
  }
  if (screen === "play" && play) {
    return (
      <PlayScreen
        play={play}
        bottomRef={bottomRef}
        onAdvance={advance}
        onSelectOption={selectOption}
        onBack={backToList}
      />
    );
  }
  return null;
};

// ── Scenario list ─────────────────────────────────────────────────────────────
const ScenarioList: React.FC<{
  scenarios: GeneticScenario[];
  loading: boolean;
  onSelect: (id: number) => void;
}> = ({ scenarios, loading, onSelect }) => (
  <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
    <h1 style={{ margin: "0 0 6px", fontSize: 24 }}>
      🧬 Генетический калькулятор
    </h1>
    <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14 }}>
      Решайте генетические задачи пошагово
    </p>

    {loading && <p style={{ color: "#888" }}>Загрузка...</p>}
    {!loading && scenarios.length === 0 && (
      <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🧬</div>
        <p>Сценарии пока не добавлены</p>
      </div>
    )}

    {scenarios.map((s) => (
      <div
        key={s.id}
        onClick={() => onSelect(s.id)}
        style={{
          background: "#fff",
          border: `2px solid ${s.is_completed ? "#27ae60" : "#e8e8e8"}`,
          borderRadius: 16,
          padding: "18px 20px",
          marginBottom: 12,
          cursor: "pointer",
          transition: "box-shadow 0.2s, transform 0.15s",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 4px 16px rgba(0,0,0,0.1)";
          (e.currentTarget as HTMLDivElement).style.transform =
            "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          (e.currentTarget as HTMLDivElement).style.transform = "none";
        }}
      >
        <div style={{ fontSize: 36, flexShrink: 0 }}>
          {s.is_completed ? "✅" : "🧬"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
            {s.title}
          </div>
          {s.description && (
            <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
              {s.description}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 12,
                background: DIFF_COLOR[s.difficulty] + "22",
                color: DIFF_COLOR[s.difficulty],
                padding: "2px 8px",
                borderRadius: 20,
                fontWeight: 600,
              }}
            >
              {DIFF_LABEL[s.difficulty]}
            </span>
            <span
              style={{
                fontSize: 12,
                background: "#fff3cd",
                color: "#856404",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              🪙 {s.coins_reward} монет
            </span>
            {s.is_completed && s.score != null && (
              <span
                style={{
                  fontSize: 12,
                  background: "#d4edda",
                  color: "#155724",
                  padding: "2px 8px",
                  borderRadius: 20,
                }}
              >
                ✓ {s.score} очков
              </span>
            )}
          </div>
        </div>
        <div style={{ color: "#bbb", fontSize: 20, flexShrink: 0 }}>›</div>
      </div>
    ))}
  </div>
);

// ── Play screen ───────────────────────────────────────────────────────────────
const PlayScreen: React.FC<{
  play: PlayState;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onAdvance: () => void;
  onSelectOption: (option: GeneticOption, step: GeneticStep) => void;
  onBack: () => void;
}> = ({ play, bottomRef, onAdvance, onSelectOption, onBack }) => {
  const visibleSteps = play.steps.slice(0, play.currentIndex + 1);
  const isLast = play.currentIndex === play.steps.length - 1;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "var(--mantine-color-body, #fff)",
          zIndex: 10,
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 20,
            color: "#666",
            padding: "4px 6px",
            borderRadius: 8,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {play.scenario.title}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            Шаг {play.currentIndex + 1} из {play.steps.length}
          </div>
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#2980b9",
            whiteSpace: "nowrap",
          }}
        >
          ⭐ {play.score}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "#f0f0f0" }}>
        <div
          style={{
            height: "100%",
            background: "#2980b9",
            width: `${((play.currentIndex + 1) / play.steps.length) * 100}%`,
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Steps */}
      <div style={{ padding: "20px 16px 48px" }}>
        {visibleSteps.map((step, idx) => {
          const isActive = idx === play.currentIndex;
          const isDone = idx < play.currentIndex;
          return (
            <StepCard
              key={step.id}
              step={step}
              isActive={isActive}
              isDone={isDone}
              answered={play.answeredIds.has(step.id)}
              feedback={isActive ? play.feedback : null}
              pendingAdvance={isActive ? play.pendingAdvance : false}
              isLast={isActive && isLast}
              onAdvance={onAdvance}
              onSelectOption={(opt) => onSelectOption(opt, step)}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

// ── Step card ─────────────────────────────────────────────────────────────────
const STEP_ICON: Record<string, string> = {
  info: "📖",
  question: "❓",
  result: "🏁",
};
const STEP_COLOR: Record<string, string> = {
  info: "#2980b9",
  question: "#8e44ad",
  result: "#27ae60",
};

const StepCard: React.FC<{
  step: GeneticStep;
  isActive: boolean;
  isDone: boolean;
  answered: boolean;
  feedback: { optionId: number; text: string; correct: boolean } | null;
  pendingAdvance: boolean;
  isLast: boolean;
  onAdvance: () => void;
  onSelectOption: (opt: GeneticOption) => void;
}> = ({
  step,
  isActive,
  isDone,
  answered,
  feedback,
  pendingAdvance,
  isLast,
  onAdvance,
  onSelectOption,
}) => {
  const [shakingId, setShakingId] = useState<number | null>(null);

  function handleSelect(opt: GeneticOption) {
    if (!opt.is_correct) {
      setShakingId(opt.id);
      setTimeout(() => setShakingId(null), 500);
    }
    onSelectOption(opt);
  }

  return (
    <div
      className="g-card"
      style={{
        background: "#fff",
        border: `2px solid ${isActive ? STEP_COLOR[step.step_type] : "#e8e8e8"}`,
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        opacity: isDone ? 0.7 : 1,
        transition: "opacity 0.3s",
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: isActive ? STEP_COLOR[step.step_type] + "15" : "#fafafa",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <span style={{ fontSize: 20 }}>{STEP_ICON[step.step_type]}</span>
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, color: "#111" }}>
          {step.title}
        </span>
        {step.step_type === "question" && step.points > 0 && (
          <span
            style={{
              fontSize: 12,
              background: "#fff3cd",
              color: "#856404",
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            +{step.points} очк.
          </span>
        )}
        {isDone && (
          <span style={{ fontSize: 18 }}>{answered ? "✅" : "📌"}</span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 16px" }}>
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 15,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            color: "#111",
          }}
        >
          {step.content}
        </p>

        {/* Answer options for question steps */}
        {step.step_type === "question" && isActive && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(step.options ?? []).map((opt) => {
              const isChosen = feedback?.optionId === opt.id;
              const isCorrect = isChosen && feedback?.correct;
              const isWrong = isChosen && !feedback?.correct;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  disabled={answered || pendingAdvance}
                  className={isWrong && shakingId === opt.id ? "g-shake" : ""}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `2px solid ${isCorrect ? "#27ae60" : isWrong ? "#e74c3c" : "#e0e0e0"}`,
                    background: isCorrect
                      ? "#d4edda"
                      : isWrong
                        ? "#fde8e8"
                        : "#fff",
                    cursor: answered || pendingAdvance ? "default" : "pointer",
                    textAlign: "left",
                    fontSize: 14,
                    fontWeight: isCorrect ? 700 : 400,
                    transition: "background 0.2s, border-color 0.2s",
                    color: isCorrect
                      ? "#155724"
                      : isWrong
                        ? "#721c24"
                        : "inherit",
                  }}
                >
                  {isCorrect && "✓ "}
                  {isWrong && "✗ "}
                  {opt.option_text}
                </button>
              );
            })}

            {/* Feedback message */}
            {feedback && (
              <div
                style={{
                  marginTop: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: feedback.correct ? "#d4edda" : "#fde8e8",
                  color: feedback.correct ? "#155724" : "#721c24",
                  fontSize: 13,
                  fontStyle: "italic",
                }}
              >
                {feedback.text}
              </div>
            )}
          </div>
        )}

        {/* Показываем объяснение для done question */}
        {step.step_type === "question" &&
          isDone &&
          answered &&
          step.explanation && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "#f0f7ff",
                color: "#2980b9",
                fontSize: 13,
                fontStyle: "italic",
              }}
            >
              {step.explanation}
            </div>
          )}

        {/* Advance button */}
        {isActive &&
          (step.step_type === "info" ||
            step.step_type === "result" ||
            pendingAdvance) && (
            <button
              onClick={onAdvance}
              style={{
                marginTop: 14,
                padding: "10px 24px",
                background: "#2980b9",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {isLast ? "Завершить" : "Далее →"}
            </button>
          )}
      </div>
    </div>
  );
};

// ── Result screen ─────────────────────────────────────────────────────────────
const ResultScreen: React.FC<{
  title: string;
  score: number;
  coins: number;
  onBack: () => void;
}> = ({ title, score, coins, onBack }) => (
  <div
    style={{
      maxWidth: 480,
      margin: "0 auto",
      padding: "48px 16px",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
    <h2 style={{ margin: "0 0 8px" }}>Сценарий пройден!</h2>
    <p style={{ color: "#666", marginBottom: 32 }}>{title}</p>
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 24,
        marginBottom: 40,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "2px solid #e8e8e8",
          borderRadius: 16,
          padding: "20px 28px",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, color: "#2980b9" }}>
          {score}
        </div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>очков</div>
      </div>
      {coins > 0 && (
        <div
          style={{
            background: "#fff",
            border: "2px solid #ffd700",
            borderRadius: 16,
            padding: "20px 28px",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f39c12" }}>
            +{coins}
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>монет</div>
        </div>
      )}
    </div>
    <button
      onClick={onBack}
      style={{
        padding: "12px 32px",
        background: "#2980b9",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        cursor: "pointer",
        fontSize: 16,
        fontWeight: 700,
      }}
    >
      К сценариям
    </button>
  </div>
);
