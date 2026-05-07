import { useEffect, useState } from 'react';
import { api, AdminVirusCase, AdminVirusClue, AdminVirusSuspect } from '../api';

const DIFF_LABEL: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const DIFF_COLOR: Record<string, string> = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const CLUE_TYPE_LABEL: Record<string, string> = { symptom: '🤒 Симптом', lab: '🔬 Лаб.данные', observation: '👁 Наблюдение' };

// ── CaseForm ──────────────────────────────────────────────────────────────────

function CaseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<AdminVirusCase>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    patient_info: initial?.patient_info ?? '',
    difficulty: initial?.difficulty ?? 'medium',
    coins_reward: String(initial?.coins_reward ?? 10),
    order_index: String(initial?.order_index ?? 0),
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const field = (label: string, key: keyof typeof form, type = 'text', opts?: string[]) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{label}</label>
      {opts ? (
        <select value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputSt}>
          {opts.map(o => <option key={o} value={o}>{DIFF_LABEL[o] ?? o}</option>)}
        </select>
      ) : type === 'checkbox' ? (
        <input type="checkbox" checked={form[key] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
      ) : type === 'textarea' ? (
        <textarea value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ ...inputSt, minHeight: 60, resize: 'vertical' }} />
      ) : (
        <input type={type} value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputSt} />
      )}
    </div>
  );

  const inputSt: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: form.title,
        description: form.description || null,
        patient_info: form.patient_info || null,
        difficulty: form.difficulty,
        coins_reward: Number(form.coins_reward),
        order_index: Number(form.order_index),
        is_active: form.is_active,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12 }}>
      {field('Название *', 'title')}
      {field('Описание', 'description', 'textarea')}
      {field('Описание пациента', 'patient_info', 'textarea')}
      {field('Сложность', 'difficulty', 'text', ['easy', 'medium', 'hard'])}
      {field('Монеты за прохождение', 'coins_reward', 'number')}
      {field('Порядок', 'order_index', 'number')}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ marginRight: 6 }} />
          Активен
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={btnSt('#3b82f6')}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button onClick={onCancel} style={btnSt('#6b7280')}>Отмена</button>
      </div>
    </div>
  );
}

// ── ClueForm ──────────────────────────────────────────────────────────────────

function ClueForm({
  caseId,
  initial,
  onSave,
  onCancel,
}: {
  caseId: number;
  initial?: Partial<AdminVirusClue>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    clue_text: initial?.clue_text ?? '',
    clue_type: initial?.clue_type ?? 'symptom',
    order_index: String(initial?.order_index ?? 0),
  });
  const [saving, setSaving] = useState(false);
  const inputSt: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };

  const handleSave = async () => {
    if (!form.clue_text.trim()) return;
    setSaving(true);
    try {
      await onSave({ clue_text: form.clue_text, clue_type: form.clue_type, order_index: Number(form.order_index) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>Тип улики</label>
        <select value={form.clue_type} onChange={e => setForm(f => ({ ...f, clue_type: e.target.value as any }))} style={inputSt}>
          <option value="symptom">🤒 Симптом</option>
          <option value="lab">🔬 Лаб. данные</option>
          <option value="observation">👁 Наблюдение</option>
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>Текст улики *</label>
        <textarea value={form.clue_text} onChange={e => setForm(f => ({ ...f, clue_text: e.target.value }))} style={{ ...inputSt, minHeight: 50, resize: 'vertical' }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>Порядок</label>
        <input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: e.target.value }))} style={inputSt} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={btnSt('#f59e0b')}>{saving ? '...' : 'Сохранить'}</button>
        <button onClick={onCancel} style={btnSt('#6b7280')}>Отмена</button>
      </div>
    </div>
  );
}

// ── SuspectForm ───────────────────────────────────────────────────────────────

function SuspectForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<AdminVirusSuspect>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    is_correct: initial?.is_correct ?? false,
    order_index: String(initial?.order_index ?? 0),
  });
  const [saving, setSaving] = useState(false);
  const inputSt: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: form.name, description: form.description || null, is_correct: form.is_correct, order_index: Number(form.order_index) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>Название патогена *</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputSt} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>Описание</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputSt, minHeight: 50, resize: 'vertical' }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          <input type="checkbox" checked={form.is_correct} onChange={e => setForm(f => ({ ...f, is_correct: e.target.checked }))} style={{ marginRight: 6 }} />
          ✅ Правильный ответ
        </label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>Порядок</label>
        <input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: e.target.value }))} style={{ ...inputSt, width: 80 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={btnSt('#8b5cf6')}>{saving ? '...' : 'Сохранить'}</button>
        <button onClick={onCancel} style={btnSt('#6b7280')}>Отмена</button>
      </div>
    </div>
  );
}

// ── CaseDetail ────────────────────────────────────────────────────────────────

function CaseDetail({ virusCase, onBack, onRefresh }: { virusCase: AdminVirusCase; onBack: () => void; onRefresh: () => void }) {
  const [data, setData] = useState<AdminVirusCase>(virusCase);
  const [addingClue, setAddingClue] = useState(false);
  const [addingSuspect, setAddingSuspect] = useState(false);
  const [editingClueId, setEditingClueId] = useState<number | null>(null);
  const [editingSuspectId, setEditingSuspectId] = useState<number | null>(null);
  const [editingCase, setEditingCase] = useState(false);

  const reload = async () => {
    const res = await api.getVirusCase(data.id);
    setData(res.case);
    onRefresh();
  };

  const clues = data.clues ?? [];
  const suspects = data.suspects ?? [];

  const st = {
    section: { marginBottom: 28 } as React.CSSProperties,
    sectionTitle: { fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 10 },
    clueRow: (type: string): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '10px 14px',
      background: '#f9fafb',
      borderRadius: 8,
      marginBottom: 6,
      borderLeft: `3px solid ${type === 'symptom' ? '#ef4444' : type === 'lab' ? '#3b82f6' : '#8b5cf6'}`,
    }),
    suspectRow: (correct: boolean): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      background: correct ? '#f0fdf4' : '#fdf4ff',
      borderRadius: 8,
      marginBottom: 6,
      border: `1px solid ${correct ? '#bbf7d0' : '#e9d5ff'}`,
    }),
  };

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, marginBottom: 16, padding: 0 }}>
        ← Назад к списку
      </button>

      {/* Case header */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>{data.title}</h2>
            {data.description && <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{data.description}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ background: DIFF_COLOR[data.difficulty] + '22', color: DIFF_COLOR[data.difficulty], borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                {DIFF_LABEL[data.difficulty]}
              </span>
              <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                🪙 {data.coins_reward}
              </span>
              <span style={{ background: data.is_active ? '#dcfce7' : '#fee2e2', color: data.is_active ? '#166534' : '#991b1b', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                {data.is_active ? 'Активен' : 'Скрыт'}
              </span>
            </div>
            {data.patient_info && (
              <div style={{ marginTop: 10, background: '#fef9f0', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#78350f' }}>
                <b>Пациент:</b> {data.patient_info}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setEditingCase(true)} style={btnSt('#6b7280', true)}>✏️ Изменить</button>
            <button onClick={async () => { if (confirm('Удалить случай?')) { await api.deleteVirusCase(data.id); onBack(); onRefresh(); } }} style={btnSt('#ef4444', true)}>🗑</button>
          </div>
        </div>

        {editingCase && (
          <div style={{ marginTop: 14 }}>
            <CaseForm
              initial={data}
              onSave={async body => { await api.updateVirusCase(data.id, body); await reload(); setEditingCase(false); }}
              onCancel={() => setEditingCase(false)}
            />
          </div>
        )}
      </div>

      {/* Clues */}
      <div style={st.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={st.sectionTitle}>Улики ({clues.length})</p>
          <button onClick={() => setAddingClue(true)} style={btnSt('#f59e0b', true)}>+ Добавить улику</button>
        </div>

        {addingClue && (
          <ClueForm
            caseId={data.id}
            onSave={async body => { await api.createVirusClue(data.id, body); await reload(); setAddingClue(false); }}
            onCancel={() => setAddingClue(false)}
          />
        )}

        {clues.map((clue, i) => (
          <div key={clue.id}>
            {editingClueId === clue.id ? (
              <ClueForm
                caseId={data.id}
                initial={clue}
                onSave={async body => { await api.updateVirusClue(clue.id, body); await reload(); setEditingClueId(null); }}
                onCancel={() => setEditingClueId(null)}
              />
            ) : (
              <div style={st.clueRow(clue.clue_type)}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', width: 20, flexShrink: 0 }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>{CLUE_TYPE_LABEL[clue.clue_type]}</span>
                  <p style={{ margin: '2px 0 0', fontSize: 13 }}>{clue.clue_text}</p>
                </div>
                <button onClick={() => setEditingClueId(clue.id)} style={smallBtn}>✏️</button>
                <button onClick={async () => { await api.deleteVirusClue(clue.id); await reload(); }} style={{ ...smallBtn, color: '#ef4444' }}>🗑</button>
              </div>
            )}
          </div>
        ))}

        {!clues.length && <p style={{ fontSize: 13, color: '#9ca3af' }}>Улик нет. Добавьте хотя бы одну.</p>}
      </div>

      {/* Suspects */}
      <div style={st.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={st.sectionTitle}>Подозреваемые ({suspects.length})</p>
          <button onClick={() => setAddingSuspect(true)} style={btnSt('#8b5cf6', true)}>+ Добавить патоген</button>
        </div>

        {addingSuspect && (
          <SuspectForm
            onSave={async body => { await api.createVirusSuspect(data.id, body); await reload(); setAddingSuspect(false); }}
            onCancel={() => setAddingSuspect(false)}
          />
        )}

        {suspects.map(suspect => (
          <div key={suspect.id}>
            {editingSuspectId === suspect.id ? (
              <SuspectForm
                initial={suspect}
                onSave={async body => { await api.updateVirusSuspect(suspect.id, body); await reload(); setEditingSuspectId(null); }}
                onCancel={() => setEditingSuspectId(null)}
              />
            ) : (
              <div style={st.suspectRow(suspect.is_correct)}>
                <span style={{ fontSize: 18 }}>{suspect.is_correct ? '✅' : '🦠'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{suspect.name}</p>
                  {suspect.description && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>{suspect.description}</p>}
                  {suspect.is_correct && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#16a34a', fontWeight: 700 }}>ПРАВИЛЬНЫЙ ОТВЕТ</p>}
                </div>
                <button onClick={() => setEditingSuspectId(suspect.id)} style={smallBtn}>✏️</button>
                <button onClick={async () => { await api.deleteVirusSuspect(suspect.id); await reload(); }} style={{ ...smallBtn, color: '#ef4444' }}>🗑</button>
              </div>
            )}
          </div>
        ))}

        {!suspects.length && <p style={{ fontSize: 13, color: '#9ca3af' }}>Подозреваемых нет. Добавьте патогены.</p>}
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

function btnSt(color: string, small = false): React.CSSProperties {
  return {
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: small ? '5px 10px' : '8px 16px',
    fontSize: small ? 12 : 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

const smallBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  padding: '2px 4px',
  opacity: 0.7,
};

// ── VirusPage ─────────────────────────────────────────────────────────────────

export default function VirusPage() {
  const [cases, setCases] = useState<AdminVirusCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminVirusCase | null>(null);
  const [addingCase, setAddingCase] = useState(false);
  const [error, setError] = useState('');

  const loadCases = async () => {
    try {
      const res = await api.getVirusCases();
      setCases(res.cases);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCases(); }, []);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  if (selected) {
    return (
      <CaseDetail
        virusCase={selected}
        onBack={() => setSelected(null)}
        onRefresh={loadCases}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>🦠 Вирусный детектив</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Управление случаями, уликами и патогенами</p>
        </div>
        <button onClick={() => setAddingCase(true)} style={btnSt('#ef4444')}>+ Новый случай</button>
      </div>

      {addingCase && (
        <CaseForm
          onSave={async body => {
            await api.createVirusCase(body);
            await loadCases();
            setAddingCase(false);
          }}
          onCancel={() => setAddingCase(false)}
        />
      )}

      {cases.length === 0 && !addingCase && (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Случаев нет. Создайте первый!</p>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Название</th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Сложность</th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Монеты</th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Улик</th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Патогенов</th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Статус</th>
            <th style={{ padding: '8px 12px' }}></th>
          </tr>
        </thead>
        <tbody>
          {cases.map(c => (
            <tr
              key={c.id}
              style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
              onClick={() => setSelected(c)}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.title}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ color: DIFF_COLOR[c.difficulty], fontWeight: 600 }}>{DIFF_LABEL[c.difficulty]}</span>
              </td>
              <td style={{ padding: '10px 12px' }}>🪙 {c.coins_reward}</td>
              <td style={{ padding: '10px 12px' }}>{(c.clues ?? []).length}</td>
              <td style={{ padding: '10px 12px' }}>{(c.suspects ?? []).length}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ color: c.is_active ? '#16a34a' : '#9ca3af', fontWeight: 600 }}>
                  {c.is_active ? '● Активен' : '○ Скрыт'}
                </span>
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                <button
                  onClick={e => { e.stopPropagation(); setSelected(c); }}
                  style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}
                >
                  Открыть →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
