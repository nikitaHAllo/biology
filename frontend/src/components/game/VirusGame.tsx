import { useEffect, useRef, useState } from 'react';
import { apiService } from '../../api';
import type { VirusCase, VirusClue, VirusSuspect } from '../../models/virus';

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
@keyframes vSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes vShake {
  0%,100% { transform: translateX(0); }
  20%,60% { transform: translateX(-6px); }
  40%,80% { transform: translateX(6px); }
}
@keyframes vPop {
  0%   { transform: scale(0.92); opacity: 0; }
  60%  { transform: scale(1.04); }
  100% { transform: scale(1);    opacity: 1; }
}
.v-slide { animation: vSlideIn 0.35s ease both; }
.v-shake { animation: vShake 0.4s ease; }
.v-pop   { animation: vPop 0.4s ease both; }
`;

function injectCss(id: string, css: string) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIFF_LABEL: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const DIFF_COLOR: Record<string, string> = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const CLUE_ICON: Record<string, string> = { symptom: '🤒', lab: '🔬', observation: '👁️' };
const CLUE_LABEL: Record<string, string> = { symptom: 'Симптом', lab: 'Лаб. данные', observation: 'Наблюдение' };

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
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px #0001'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.transform = ''; }}
        >
          <div style={styles.icon}>🦠</div>
          <div style={{ flex: 1 }}>
            <p style={styles.title}>{c.title}</p>
            {c.description && <p style={styles.desc}>{c.description}</p>}
            <div style={styles.badges}>
              <span style={styles.badge(DIFF_COLOR[c.difficulty] ?? '#6b7280')}>{DIFF_LABEL[c.difficulty] ?? c.difficulty}</span>
              <span style={styles.badge('#f59e0b')}>🪙 {c.coins_reward} монет</span>
              {c.is_completed && <span style={styles.badge('#22c55e')}>✓ Решён ({c.score}%)</span>}
            </div>
          </div>
          <span style={styles.done}>{c.is_completed ? '✅' : '▶'}</span>
        </div>
      ))}
    </div>
  );
}

// ── PlayScreen ────────────────────────────────────────────────────────────────

interface PlayState {
  virusCase: VirusCase;
  clues: VirusClue[];
  suspects: VirusSuspect[];
  revealedCount: number;
  eliminatedIds: Set<number>;
  won: boolean;
  correctId: number | null;
  resultCoins: number;
  resultScore: number;
  shakeId: number | null;
  feedbackId: number | null;
}

function PlayScreen({ virusCase, onBack }: { virusCase: VirusCase; onBack: () => void }) {
  const [state, setState] = useState<PlayState | null>(null);
  const [loading, setLoading] = useState(true);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiService.getVirusCase(virusCase.id)
      .then(d => {
        const c = d.case;
        setState({
          virusCase: c,
          clues: c.clues ?? [],
          suspects: c.suspects ?? [],
          revealedCount: 0,
          eliminatedIds: new Set(),
          won: false,
          correctId: null,
          resultCoins: 0,
          resultScore: 0,
          shakeId: null,
          feedbackId: null,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    return () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); };
  }, [virusCase.id]);

  if (loading || !state) return <p style={{ padding: 16, color: '#6b7280' }}>Загрузка...</p>;

  const visibleClues = state.clues.slice(0, state.revealedCount);
  const allRevealed = state.revealedCount >= state.clues.length;
  const activeSuspects = state.suspects.filter(s => !state.eliminatedIds.has(s.id));

  const revealNext = () => {
    if (!allRevealed) setState(s => s ? { ...s, revealedCount: s.revealedCount + 1 } : s);
  };

  const handleGuess = async (suspect: VirusSuspect) => {
    if (state.won || state.eliminatedIds.has(suspect.id)) return;
    try {
      const res = await apiService.guessVirusSuspect(state.virusCase.id, suspect.id);
      if (res.is_correct) {
        const complete = await apiService.completeVirusCase(state.virusCase.id, state.revealedCount);
        setState(s => s ? { ...s, won: true, correctId: suspect.id, resultCoins: complete.coins_earned, resultScore: complete.score } : s);
      } else {
        setState(s => s ? { ...s, eliminatedIds: new Set([...s.eliminatedIds, suspect.id]), shakeId: suspect.id, feedbackId: suspect.id } : s);
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
          setState(s => s ? { ...s, shakeId: null, feedbackId: null } : s);
        }, 1800);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const st = {
    layout: { display: 'flex', gap: 20, alignItems: 'flex-start' } as React.CSSProperties,
    left: { flex: 1, minWidth: 0 } as React.CSSProperties,
    right: { width: 260, flexShrink: 0 } as React.CSSProperties,
    section: { marginBottom: 20 } as React.CSSProperties,
    sectionTitle: { fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 },
    patientCard: {
      background: '#fef9f0',
      border: '1px solid #fde68a',
      borderRadius: 12,
      padding: '12px 16px',
      fontSize: 14,
      color: '#78350f',
      marginBottom: 16,
    } as React.CSSProperties,
    clueItem: (type: string) => ({
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '10px 14px',
      background: '#f9fafb',
      borderRadius: 10,
      marginBottom: 8,
      borderLeft: `3px solid ${type === 'symptom' ? '#ef4444' : type === 'lab' ? '#3b82f6' : '#8b5cf6'}`,
      animation: 'vSlideIn 0.35s ease both',
    }) as React.CSSProperties,
    clueIcon: { fontSize: 18, flexShrink: 0 } as React.CSSProperties,
    clueBody: { flex: 1 } as React.CSSProperties,
    clueType: { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' as const },
    clueText: { fontSize: 14, color: '#111827', marginTop: 1 } as React.CSSProperties,
    revealBtn: {
      width: '100%',
      padding: '10px 0',
      background: '#3b82f6',
      color: '#fff',
      border: 'none',
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: 4,
    } as React.CSSProperties,
    suspectCard: (id: number) => {
      const eliminated = state.eliminatedIds.has(id);
      const correct = state.correctId === id;
      return {
        padding: '12px 14px',
        borderRadius: 12,
        border: `2px solid ${correct ? '#22c55e' : eliminated ? '#e5e7eb' : '#e5e7eb'}`,
        background: correct ? '#f0fdf4' : eliminated ? '#f9fafb' : '#fff',
        marginBottom: 8,
        cursor: eliminated || state.won ? 'default' : 'pointer',
        opacity: eliminated ? 0.45 : 1,
        transition: 'border-color 0.2s, background 0.2s, opacity 0.2s',
        position: 'relative' as const,
      } as React.CSSProperties;
    },
    suspectName: { fontSize: 14, fontWeight: 600, color: '#111827' } as React.CSSProperties,
    suspectDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 } as React.CSSProperties,
    eliminated: { fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 4 } as React.CSSProperties,
    wrongFeedback: {
      position: 'absolute' as const,
      top: 8, right: 10,
      fontSize: 11,
      color: '#ef4444',
      fontWeight: 700,
      background: '#fef2f2',
      borderRadius: 6,
      padding: '2px 7px',
    } as React.CSSProperties,
    wonBanner: {
      background: '#f0fdf4',
      border: '2px solid #22c55e',
      borderRadius: 14,
      padding: '20px 24px',
      textAlign: 'center' as const,
      marginBottom: 20,
      animation: 'vPop 0.4s ease both',
    } as React.CSSProperties,
    wonTitle: { fontSize: 22, fontWeight: 800, color: '#15803d', margin: '0 0 6px' } as React.CSSProperties,
    wonSub: { fontSize: 14, color: '#166534' } as React.CSSProperties,
    progress: {
      height: 6,
      background: '#e5e7eb',
      borderRadius: 99,
      overflow: 'hidden',
      marginBottom: 12,
    } as React.CSSProperties,
    progressBar: {
      height: '100%',
      background: '#3b82f6',
      borderRadius: 99,
      transition: 'width 0.4s ease',
      width: `${state.clues.length > 0 ? (state.revealedCount / state.clues.length) * 100 : 0}%`,
    } as React.CSSProperties,
  };

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#6b7280', marginBottom: 16, padding: 0 }}
      >
        ← Назад к списку
      </button>

      {state.won && (
        <div style={st.wonBanner} className="v-pop">
          <p style={st.wonTitle}>🎉 Дело раскрыто!</p>
          <p style={st.wonSub}>
            Счёт: <b>{state.resultScore}%</b> · Монеты: <b>{state.resultCoins > 0 ? `+${state.resultCoins} 🪙` : '0 (уже получены)'}</b>
          </p>
          <p style={st.wonSub}>Улик использовано: {state.revealedCount} из {state.clues.length}</p>
        </div>
      )}

      <div style={st.layout}>
        {/* Left: patient + clues */}
        <div style={st.left}>
          {state.virusCase.patient_info && (
            <div style={st.section}>
              <p style={st.sectionTitle}>Пациент</p>
              <div style={st.patientCard}>{state.virusCase.patient_info}</div>
            </div>
          )}

          <div style={st.section}>
            <p style={st.sectionTitle}>
              Улики ({state.revealedCount}/{state.clues.length})
            </p>
            <div style={st.progress}>
              <div style={st.progressBar} />
            </div>

            {visibleClues.map(clue => (
              <div key={clue.id} style={st.clueItem(clue.clue_type)}>
                <span style={st.clueIcon}>{CLUE_ICON[clue.clue_type] ?? '📋'}</span>
                <div style={st.clueBody}>
                  <p style={st.clueType}>{CLUE_LABEL[clue.clue_type] ?? clue.clue_type}</p>
                  <p style={st.clueText}>{clue.clue_text}</p>
                </div>
              </div>
            ))}

            {!state.won && (
              <button
                style={{ ...st.revealBtn, ...(allRevealed ? { background: '#9ca3af', cursor: 'default' } : {}) }}
                onClick={revealNext}
                disabled={allRevealed}
              >
                {allRevealed ? 'Все улики открыты' : `Следующая улика (${state.clues.length - state.revealedCount} осталось)`}
              </button>
            )}
          </div>
        </div>

        {/* Right: suspects */}
        <div style={st.right}>
          <p style={st.sectionTitle}>Подозреваемые</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
            {state.won
              ? 'Дело закрыто'
              : activeSuspects.length === 1
              ? 'Остался один — назови его!'
              : 'Нажми на патоген, чтобы обвинить его'}
          </p>
          {state.suspects.map(suspect => (
            <div
              key={suspect.id}
              className={state.shakeId === suspect.id ? 'v-shake' : ''}
              style={st.suspectCard(suspect.id)}
              onClick={() => handleGuess(suspect)}
            >
              {state.feedbackId === suspect.id && (
                <span style={st.wrongFeedback}>Не то!</span>
              )}
              <p style={st.suspectName}>
                {state.correctId === suspect.id ? '✅ ' : state.eliminatedIds.has(suspect.id) ? '❌ ' : '🦠 '}
                {suspect.name}
              </p>
              {suspect.description && <p style={st.suspectDesc}>{suspect.description}</p>}
              {state.eliminatedIds.has(suspect.id) && (
                <p style={st.eliminated}>Исключён</p>
              )}
            </div>
          ))}
        </div>
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
    maxWidth: 860,
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
              Раскрывай улики одну за другой и определи, какой патоген вызвал болезнь. Чем меньше улик — тем выше счёт.
            </p>
          </div>
          <CaseList onSelect={setSelected} />
        </>
      ) : (
        <PlayScreen virusCase={selected} onBack={() => setSelected(null)} />
      )}
    </div>
  );
}
