import { useEffect, useRef, useState } from 'react';
import { apiService } from '../../api';
import type {
	VirusCase,
	VirusChapter,
	VirusChapterOption,
	VirusSubmitAnswerResponse,
	CompleteVirusCaseResponse,
} from '../../models/virus';

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
@keyframes vSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes vPop {
  0%   { transform: scale(0.92); opacity: 0; }
  60%  { transform: scale(1.04); }
  100% { transform: scale(1);    opacity: 1; }
}
@keyframes vFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.v-slide { animation: vSlideIn 0.35s ease both; }
.v-pop   { animation: vPop 0.4s ease both; }
.v-fade  { animation: vFadeIn 0.3s ease both; }
`;

function injectCss(id: string, css: string) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFF_LABEL: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const DIFF_COLOR: Record<string, string> = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

// ── Shared styles helper ──────────────────────────────────────────────────────

const btn = (bg: string, small = false): React.CSSProperties => ({
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: small ? '8px 16px' : '12px 24px',
  fontSize: small ? 13 : 15,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
});

// ── CaseList ──────────────────────────────────────────────────────────────────

function CaseList({ onSelect }: { onSelect: (c: VirusCase) => void }) {
  const [cases, setCases] = useState<VirusCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getVirusCases()
      .then(d => setCases(d.cases))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const styles = {
    wrap: { padding: '8px 0' } as React.CSSProperties,
    card: {
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '16px 20px',
      marginBottom: 12,
      cursor: 'pointer',
      transition: 'box-shadow 0.15s, transform 0.15s',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    } as React.CSSProperties,
    icon: {
      fontSize: 36,
      width: 56,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fef2f2',
      borderRadius: 12,
      flexShrink: 0,
    } as React.CSSProperties,
    title: { fontSize: 16, fontWeight: 700, margin: 0 } as React.CSSProperties,
    desc: { fontSize: 13, color: '#6b7280', marginTop: 2 } as React.CSSProperties,
    badges: { display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' as const },
    badge: (color: string) => ({
      background: color + '22',
      color,
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 12,
      fontWeight: 600,
    }) as React.CSSProperties,
    done: {
      marginLeft: 'auto',
      fontSize: 13,
      color: '#22c55e',
      fontWeight: 600,
      flexShrink: 0,
    } as React.CSSProperties,
  };

  if (loading) return <p style={{ color: '#6b7280', padding: 16 }}>Загрузка случаев...</p>;
  if (!cases.length) return <p style={{ color: '#6b7280', padding: 16 }}>Случаев пока нет. Создайте их в разделе администратора.</p>;

  return (
    <div style={styles.wrap}>
      {cases.map(c => (
        <div
          key={c.id}
          className="v-slide"
          style={styles.card}
          onClick={() => onSelect(c)}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px #0001';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '';
            (e.currentTarget as HTMLDivElement).style.transform = '';
          }}
        >
          <div style={styles.icon}>🦠</div>
          <div style={{ flex: 1 }}>
            <p style={styles.title}>{c.title}</p>
            {c.description && <p style={styles.desc}>{c.description}</p>}
            <div style={styles.badges}>
              <span style={styles.badge(DIFF_COLOR[c.difficulty] ?? '#6b7280')}>{DIFF_LABEL[c.difficulty] ?? c.difficulty}</span>
              <span style={styles.badge('#f59e0b')}>🪙 {c.coins_reward} монет</span>
              {c.is_completed && (
                <span style={styles.badge('#22c55e')}>
                  ✓ Пройдено ({c.score ?? 0}%)
                </span>
              )}
            </div>
          </div>
          <span style={styles.done}>{c.is_completed ? '✅' : '▶'}</span>
        </div>
      ))}
    </div>
  );
}

// ── GameScreen ────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'reading' | 'answered' | 'finished';

interface AnswerRecord {
  optionId: number;
  is_correct: boolean;
  consequence_text: string;
  correct_option_id: number;
}

interface GameState {
  activeCase: VirusCase;
  chapters: VirusChapter[];
  currentChapterIndex: number;
  answers: Record<number, AnswerRecord>; // chapterId -> answer
  phase: Phase;
  correctCount: number;
  gameResult: CompleteVirusCaseResponse | null;
  submitting: boolean;
  completing: boolean;
}

function GameScreen({ virusCase, onBack }: { virusCase: VirusCase; onBack: () => void }) {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const completeCalledRef = useRef(false);

  useEffect(() => {
    apiService.getVirusCase(virusCase.id)
      .then(d => {
        const c = d.case;
        setState({
          activeCase: c,
          chapters: c.chapters ?? [],
          currentChapterIndex: -1, // -1 = intro screen
          answers: {},
          phase: 'intro',
          correctCount: 0,
          gameResult: null,
          submitting: false,
          completing: false,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [virusCase.id]);

  // Trigger complete when entering finished phase
  useEffect(() => {
    if (!state || state.phase !== 'finished' || completeCalledRef.current) return;
    completeCalledRef.current = true;
    const { activeCase, chapters, correctCount } = state;
    setState(s => s ? { ...s, completing: true } : s);
    apiService.completeVirusCase(activeCase.id, correctCount, chapters.length)
      .then(result => {
        setState(s => s ? { ...s, gameResult: result, completing: false } : s);
      })
      .catch(err => {
        console.error('complete error:', err);
        setState(s => s ? { ...s, completing: false } : s);
      });
  }, [state?.phase]);

  if (loading || !state) return <p style={{ padding: 16, color: '#6b7280' }}>Загрузка...</p>;

  const { activeCase, chapters, currentChapterIndex, answers, phase, correctCount, gameResult, submitting, completing } = state;
  const currentChapter: VirusChapter | undefined = chapters[currentChapterIndex];
  const totalChapters = chapters.length;
  const progress = totalChapters > 0 ? ((currentChapterIndex + 1) / totalChapters) * 100 : 0;

  const handleStartGame = () => {
    setState(s => s ? { ...s, currentChapterIndex: 0, phase: 'reading' } : s);
  };

  const handleSelectOption = async (option: VirusChapterOption) => {
    if (!currentChapter || state.submitting) return;
    setState(s => s ? { ...s, submitting: true } : s);
    try {
      const result: VirusSubmitAnswerResponse  = await apiService.submitVirusAnswer(
        activeCase.id,
        currentChapter.id,
        option.id,
      );
      setState(s => {
        if (!s) return s;
        const newAnswers = {
          ...s.answers,
          [currentChapter.id]: {
            optionId: option.id,
            is_correct: result.is_correct,
            consequence_text: result.consequence_text,
            correct_option_id: result.correct_option_id,
          },
        };
        return {
          ...s,
          answers: newAnswers,
          correctCount: result.is_correct ? s.correctCount + 1 : s.correctCount,
          phase: 'answered',
          submitting: false,
        };
      });
    } catch (e) {
      console.error(e);
      setState(s => s ? { ...s, submitting: false } : s);
    }
  };

  const handleNextChapter = () => {
    const nextIndex = currentChapterIndex + 1;
    if (nextIndex >= totalChapters) {
      setState(s => s ? { ...s, phase: 'finished' } : s);
    } else {
      setState(s => s ? { ...s, currentChapterIndex: nextIndex, phase: 'reading' } : s);
    }
  };

  const st = {
    backBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#6b7280', marginBottom: 16, padding: 0 } as React.CSSProperties,
    progressBar: {
      height: 6,
      background: '#e5e7eb',
      borderRadius: 99,
      overflow: 'hidden',
      marginBottom: 20,
    } as React.CSSProperties,
    progressFill: {
      height: '100%',
      background: '#3b82f6',
      borderRadius: 99,
      transition: 'width 0.4s ease',
      width: `${progress}%`,
    } as React.CSSProperties,
    card: {
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '20px 24px',
      marginBottom: 16,
    } as React.CSSProperties,
    narrativeBox: {
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: 12,
      padding: '14px 18px',
      fontSize: 14,
      color: '#0c4a6e',
      lineHeight: 1.6,
      marginBottom: 20,
    } as React.CSSProperties,
    questionText: {
      fontSize: 16,
      fontWeight: 700,
      color: '#111827',
      marginBottom: 16,
    } as React.CSSProperties,
    chapterTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: '#6b7280',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginBottom: 8,
    },
    optionBtn: (selected: boolean, isCorrect: boolean, isWrong: boolean): React.CSSProperties => ({
      width: '100%',
      textAlign: 'left' as const,
      padding: '12px 16px',
      borderRadius: 10,
      border: `2px solid ${isCorrect ? '#22c55e' : isWrong ? '#ef4444' : selected ? '#3b82f6' : '#e5e7eb'}`,
      background: isCorrect ? '#f0fdf4' : isWrong ? '#fef2f2' : selected ? '#eff6ff' : '#fff',
      cursor: selected || isCorrect || isWrong ? 'default' : 'pointer',
      fontSize: 14,
      fontWeight: selected || isCorrect || isWrong ? 600 : 400,
      color: isCorrect ? '#15803d' : isWrong ? '#b91c1c' : '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
      transition: 'border-color 0.2s, background 0.2s',
    }),
    optionLetter: (selected: boolean, isCorrect: boolean, isWrong: boolean): React.CSSProperties => ({
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: isCorrect ? '#22c55e' : isWrong ? '#ef4444' : selected ? '#3b82f6' : '#f3f4f6',
      color: isCorrect || isWrong || selected ? '#fff' : '#374151',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 700,
      flexShrink: 0,
    }),
    consequenceBox: {
      background: '#fefce8',
      border: '1px solid #fde047',
      borderRadius: 12,
      padding: '14px 18px',
      fontSize: 14,
      color: '#713f12',
      lineHeight: 1.6,
      marginTop: 16,
      marginBottom: 16,
    } as React.CSSProperties,
    resultBanner: (passed: boolean): React.CSSProperties => ({
      background: passed ? '#f0fdf4' : '#fff7ed',
      border: `2px solid ${passed ? '#22c55e' : '#fb923c'}`,
      borderRadius: 16,
      padding: '28px 32px',
      textAlign: 'center' as const,
      marginBottom: 20,
    }),
    resultTitle: (passed: boolean): React.CSSProperties => ({
      fontSize: 26,
      fontWeight: 800,
      color: passed ? '#15803d' : '#c2410c',
      margin: '0 0 12px',
    }),
    resultText: {
      fontSize: 14,
      lineHeight: 1.6,
      color: '#374151',
      marginBottom: 16,
    } as React.CSSProperties,
    scoreText: (passed: boolean): React.CSSProperties => ({
      fontSize: 18,
      fontWeight: 700,
      color: passed ? '#15803d' : '#c2410c',
      marginBottom: 12,
    }),
    coinsBadge: {
      display: 'inline-block',
      background: '#fef3c7',
      color: '#92400e',
      borderRadius: 8,
      padding: '6px 14px',
      fontSize: 15,
      fontWeight: 700,
      marginBottom: 20,
    } as React.CSSProperties,
    introCard: {
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '28px 32px',
      marginBottom: 20,
    } as React.CSSProperties,
    roleText: {
      fontSize: 15,
      color: '#374151',
      lineHeight: 1.7,
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '16px 20px',
      marginTop: 12,
      marginBottom: 20,
    } as React.CSSProperties,
  };

  // ── Intro Screen ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="v-slide">
        <button onClick={onBack} style={st.backBtn}>← Назад к списку</button>
        <div style={st.introCard}>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>🦠 {activeCase.title}</h2>
          {activeCase.description && (
            <p style={{ margin: '0 0 12px', fontSize: 14, color: '#6b7280' }}>{activeCase.description}</p>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ background: DIFF_COLOR[activeCase.difficulty] + '22', color: DIFF_COLOR[activeCase.difficulty], borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
              {DIFF_LABEL[activeCase.difficulty]}
            </span>
            <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
              🪙 {activeCase.coins_reward} монет
            </span>
            <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
              {totalChapters} {totalChapters === 1 ? 'глава' : totalChapters < 5 ? 'главы' : 'глав'}
            </span>
          </div>
          {activeCase.role_description && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                Твоя роль
              </p>
              <div style={st.roleText}>{activeCase.role_description}</div>
            </div>
          )}
          {totalChapters === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Главы ещё не добавлены в этот случай.</p>
          ) : (
            <button onClick={handleStartGame} style={btn('#3b82f6')}>
              Начать расследование →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Finished Screen ───────────────────────────────────────────────────────
  if (phase === 'finished') {
    const isPassed = gameResult ? gameResult.is_passed : (correctCount / Math.max(totalChapters, 1)) >= 0.5;
    const scoreVal = gameResult ? gameResult.score : Math.round((correctCount / Math.max(totalChapters, 1)) * 100);
    const displayText = isPassed ? activeCase.success_text : activeCase.failure_text;

    return (
      <div className="v-pop">
        <button onClick={onBack} style={st.backBtn}>← Назад к списку</button>
        <div style={st.resultBanner(isPassed)}>
          <p style={{ fontSize: 36, margin: '0 0 8px' }}>{isPassed ? '🎉' : '⚠️'}</p>
          <p style={st.resultTitle(isPassed)}>
            {isPassed ? 'Расследование завершено!' : 'Нужно ещё поучиться'}
          </p>
          <p style={st.scoreText(isPassed)}>
            {correctCount} / {totalChapters} правильных ответов — {scoreVal}%
          </p>
          {completing && <p style={{ color: '#9ca3af', fontSize: 13 }}>Сохранение результата...</p>}
          {gameResult && gameResult.coins_earned > 0 && (
            <span style={st.coinsBadge}>+{gameResult.coins_earned} 🪙 монет</span>
          )}
          {displayText && (
            <p style={st.resultText}>{displayText}</p>
          )}
        </div>
        <button onClick={onBack} style={btn('#6b7280')}>
          Вернуться к делам
        </button>
      </div>
    );
  }

  // ── Chapter Screen ────────────────────────────────────────────────────────
  if (!currentChapter) return null;

  const answerRecord = answers[currentChapter.id];
  const isAnswered = !!answerRecord;

  return (
    <div>
      <button onClick={onBack} style={st.backBtn}>← Назад к списку</button>

      {/* Progress bar */}
      <div style={st.progressBar}>
        <div style={st.progressFill} />
      </div>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, textAlign: 'right' }}>
        Глава {currentChapterIndex + 1} из {totalChapters}
      </p>

      {/* Chapter card */}
      <div style={st.card} className="v-slide">
        <p style={st.chapterTitle}>{currentChapter.title}</p>

        {/* Narrative */}
        <div style={st.narrativeBox}>
          {currentChapter.narrative_text}
        </div>

        {/* Question */}
        <p style={st.questionText}>{currentChapter.question_text}</p>

        {/* Options */}
        <div>
          {currentChapter.options.map((option, idx) => {
            const isSelected = answerRecord?.optionId === option.id;
            const isCorrect = isAnswered && option.id === answerRecord.correct_option_id;
            const isWrong = isAnswered && isSelected && !answerRecord.is_correct;

            return (
              <button
                key={option.id}
                style={st.optionBtn(isSelected, isCorrect, isWrong)}
                disabled={isAnswered || submitting}
                onClick={() => handleSelectOption(option)}
              >
                <span style={st.optionLetter(isSelected, isCorrect, isWrong)}>
                  {isCorrect ? '✓' : isWrong ? '✗' : OPTION_LETTERS[idx] ?? String(idx + 1)}
                </span>
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>

        {/* Consequence text after answering */}
        {isAnswered && (
          <div style={st.consequenceBox} className="v-fade">
            <strong>{answerRecord.is_correct ? '✅ Верно! ' : '❌ Неверно. '}</strong>
            {answerRecord.consequence_text}
          </div>
        )}

        {/* Next / Finish button */}
        {isAnswered && (
          <div style={{ textAlign: 'right' }} className="v-fade">
            <button onClick={handleNextChapter} style={btn('#3b82f6', true)}>
              {currentChapterIndex + 1 >= totalChapters ? 'Завершить' : 'Следующая глава →'}
            </button>
          </div>
        )}

        {submitting && (
          <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>Проверка...</p>
        )}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function VirusGame() {
  injectCss('virus-game-css', CSS);
  const [selected, setSelected] = useState<VirusCase | null>(null);

  const wrap: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: 720,
    margin: '0 auto',
    padding: '16px',
  };

  const header: React.CSSProperties = {
    marginBottom: 20,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 16,
  };

  return (
    <div style={wrap}>
      {!selected ? (
        <>
          <div style={header}>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>🦠 Вирусный детектив</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
              Расследуй вирусные случаи по главам — анализируй ситуацию и принимай решения как молодой вирусолог.
            </p>
          </div>
          <CaseList onSelect={setSelected} />
        </>
      ) : (
        <GameScreen virusCase={selected} onBack={() => setSelected(null)} />
      )}
    </div>
  );
}
