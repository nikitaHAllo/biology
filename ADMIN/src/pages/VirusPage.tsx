import { useEffect, useState } from 'react';
import {
  api,
  AdminVirusCase,
  AdminVirusChapter,
  AdminVirusChapterOption,
} from '../api';

const DIFF_LABEL: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const DIFF_COLOR: Record<string, string> = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };

const inputSt: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 13,
  boxSizing: 'border-box',
};

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
    role_description: initial?.role_description ?? '',
    success_text: initial?.success_text ?? '',
    failure_text: initial?.failure_text ?? '',
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
        <textarea value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ ...inputSt, minHeight: 70, resize: 'vertical' }} />
      ) : (
        <input type={type} value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputSt} />
      )}
    </div>
  );

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: form.title,
        description: form.description || null,
        patient_info: form.patient_info || null,
        role_description: form.role_description || null,
        success_text: form.success_text || null,
        failure_text: form.failure_text || null,
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
      {field('Описание пациента (устаревшее)', 'patient_info', 'textarea')}
      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '12px 0' }} />
      <p style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', margin: '0 0 8px' }}>Нарративные поля</p>
      {field('Роль игрока (role_description)', 'role_description', 'textarea')}
      {field('Текст при успехе (≥50%)', 'success_text', 'textarea')}
      {field('Текст при провале (<50%)', 'failure_text', 'textarea')}
      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '12px 0' }} />
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

// ── ChapterForm ───────────────────────────────────────────────────────────────

function ChapterForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<AdminVirusChapter>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    narrative_text: initial?.narrative_text ?? '',
    question_text: initial?.question_text ?? '',
    is_final: initial?.is_final ?? false,
    order_index: String(initial?.order_index ?? 0),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim() || !form.narrative_text.trim()) return;
    if (!form.is_final && !form.question_text.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: form.title,
        narrative_text: form.narrative_text,
        question_text: form.is_final ? undefined : form.question_text,
        is_final: form.is_final,
        order_index: Number(form.order_index),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: form.is_final ? '#fffbeb' : '#eff6ff', border: `1px solid ${form.is_final ? '#fcd34d' : '#bfdbfe'}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
      {/* is_final toggle */}
      <div style={{ marginBottom: 10, padding: '8px 10px', background: form.is_final ? '#fef3c7' : '#f0f9ff', borderRadius: 6, border: `1px solid ${form.is_final ? '#fde68a' : '#bae6fd'}` }}>
        <label style={{ fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={form.is_final}
            onChange={e => setForm(f => ({ ...f, is_final: e.target.checked }))}
          />
          ★ Финальная глава (без вопроса — только нарратив, завершает игру)
        </label>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>
          Название главы *
        </label>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          style={inputSt}
          placeholder={form.is_final ? 'Эпилог. Расследование завершено' : 'Глава 1. Первый пациент'}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>
          {form.is_final ? 'Финальный нарратив * (заключение истории)' : 'Нарративный текст * (контекст перед вопросом)'}
        </label>
        <textarea
          value={form.narrative_text}
          onChange={e => setForm(f => ({ ...f, narrative_text: e.target.value }))}
          style={{ ...inputSt, minHeight: 80, resize: 'vertical' }}
        />
      </div>

      {/* Question — only for non-final chapters */}
      {!form.is_final && (
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>Вопрос *</label>
          <textarea
            value={form.question_text}
            onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
            style={{ ...inputSt, minHeight: 50, resize: 'vertical' }}
          />
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>Порядок</label>
        <input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: e.target.value }))} style={{ ...inputSt, width: 80 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={btnSt(form.is_final ? '#f59e0b' : '#3b82f6')}>{saving ? '...' : 'Сохранить'}</button>
        <button onClick={onCancel} style={btnSt('#6b7280')}>Отмена</button>
      </div>
    </div>
  );
}

// ── OptionForm ────────────────────────────────────────────────────────────────

function OptionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<AdminVirusChapterOption>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    text: initial?.text ?? '',
    is_correct: initial?.is_correct ?? false,
    consequence_text: initial?.consequence_text ?? '',
    order_index: String(initial?.order_index ?? 0),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.text.trim() || !form.consequence_text.trim()) return;
    setSaving(true);
    try {
      await onSave({
        text: form.text,
        is_correct: form.is_correct,
        consequence_text: form.consequence_text,
        order_index: Number(form.order_index),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>Текст варианта *</label>
        <input value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} style={inputSt} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          <input type="checkbox" checked={form.is_correct} onChange={e => setForm(f => ({ ...f, is_correct: e.target.checked }))} style={{ marginRight: 6 }} />
          ✅ Правильный ответ
        </label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>Текст последствия * (показывается после выбора)</label>
        <textarea value={form.consequence_text} onChange={e => setForm(f => ({ ...f, consequence_text: e.target.value }))} style={{ ...inputSt, minHeight: 60, resize: 'vertical' }} />
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

// ── ChapterItem ───────────────────────────────────────────────────────────────

function ChapterItem({
  chapter,
  onUpdate,
}: {
  chapter: AdminVirusChapter;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingOption, setAddingOption] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);

  const correctCount = (chapter.options ?? []).filter(o => o.is_correct).length;
  const hasMultipleCorrect = correctCount > 1;

  return (
    <div style={{ border: '1px solid #bfdbfe', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
      {/* Chapter header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#eff6ff', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: chapter.is_final ? '#92400e' : '#1d4ed8', flex: 1 }}>
          [{chapter.order_index}] {chapter.title}
        </span>
        {chapter.is_final ? (
          <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
            ★ ФИНАЛ
          </span>
        ) : (
          <span style={{ fontSize: 12, color: '#6b7280' }}>{(chapter.options ?? []).length} вар.</span>
        )}
        {hasMultipleCorrect && (
          <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
            ⚠ {correctCount} правильных
          </span>
        )}
        <button onClick={e => { e.stopPropagation(); setEditing(true); setExpanded(true); }} style={smallBtn}>✏️</button>
        <button onClick={async e => {
          e.stopPropagation();
          if (confirm('Удалить главу и все её варианты?')) {
            await api.deleteVirusChapter(chapter.id);
            onUpdate();
          }
        }} style={{ ...smallBtn, color: '#ef4444' }}>🗑</button>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '14px 16px', background: '#fff' }}>
          {editing && (
            <ChapterForm
              initial={chapter}
              onSave={async body => { await api.updateVirusChapter(chapter.id, body); setEditing(false); onUpdate(); }}
              onCancel={() => setEditing(false)}
            />
          )}

          {!editing && (
            <>
              {chapter.is_final && (
                <div style={{ marginBottom: 10, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                  ★ Финальная глава — показывает только нарратив, не считается в счёте
                </div>
              )}
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Нарратив</p>
                <p style={{ fontSize: 13, color: '#374151', background: '#f9fafb', borderRadius: 6, padding: '8px 10px', margin: 0 }}>{chapter.narrative_text}</p>
              </div>
              {!chapter.is_final && chapter.question_text && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Вопрос</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', background: '#f0f9ff', borderRadius: 6, padding: '8px 10px', margin: 0 }}>{chapter.question_text}</p>
                </div>
              )}
            </>
          )}

          {/* Options — only for non-final chapters */}
          {!chapter.is_final && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', margin: 0 }}>
                  Варианты ответа ({(chapter.options ?? []).length})
                </p>
                <button onClick={() => setAddingOption(true)} style={btnSt('#8b5cf6', true)}>+ Добавить вариант</button>
              </div>

              {addingOption && (
                <OptionForm
                  onSave={async body => { await api.createVirusChapterOption(chapter.id, body); setAddingOption(false); onUpdate(); }}
                  onCancel={() => setAddingOption(false)}
                />
              )}

              {(chapter.options ?? []).map((opt, idx) => (
                <div key={opt.id}>
                  {editingOptionId === opt.id ? (
                    <OptionForm
                      initial={opt}
                      onSave={async body => { await api.updateVirusChapterOption(opt.id, body); setEditingOptionId(null); onUpdate(); }}
                      onCancel={() => setEditingOptionId(null)}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 12px',
                      background: opt.is_correct ? '#f0fdf4' : '#fdf4ff',
                      border: `1px solid ${opt.is_correct ? '#bbf7d0' : '#e9d5ff'}`,
                      borderRadius: 8,
                      marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', width: 20, flexShrink: 0 }}>{idx + 1}.</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
                          {opt.is_correct ? '✅ ' : '○ '}{opt.text}
                        </p>
                        {opt.consequence_text && (
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
                            → {opt.consequence_text}
                          </p>
                        )}
                      </div>
                      <button onClick={() => setEditingOptionId(opt.id)} style={smallBtn}>✏️</button>
                      <button onClick={async () => { await api.deleteVirusChapterOption(opt.id); onUpdate(); }} style={{ ...smallBtn, color: '#ef4444' }}>🗑</button>
                    </div>
                  )}
                </div>
              ))}

              {!(chapter.options ?? []).length && !addingOption && (
                <p style={{ fontSize: 12, color: '#9ca3af' }}>Вариантов нет. Добавьте хотя бы 2-3.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── CaseDetail ────────────────────────────────────────────────────────────────

function CaseDetail({
  virusCase,
  onBack,
  onRefresh,
}: {
  virusCase: AdminVirusCase;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [data, setData] = useState<AdminVirusCase>(virusCase);
  const [editingCase, setEditingCase] = useState(false);
  const [addingChapter, setAddingChapter] = useState(false);

  const reload = async () => {
    const res = await api.getVirusCase(data.id);
    setData(res.case);
    onRefresh();
  };

  const chapters = (data.chapters ?? []).sort((a, b) => a.order_index - b.order_index);

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, marginBottom: 16, padding: 0 }}>
        ← Назад к списку
      </button>

      {/* Case header */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
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
              <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                {chapters.length} глав
              </span>
            </div>
            {data.role_description && (
              <div style={{ marginTop: 10, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#0c4a6e' }}>
                <b>Роль:</b> {data.role_description}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setEditingCase(true)} style={btnSt('#6b7280', true)}>✏️ Изменить</button>
            <button
              onClick={async () => {
                if (confirm('Удалить случай со всеми главами?')) {
                  await api.deleteVirusCase(data.id);
                  onBack();
                  onRefresh();
                }
              }}
              style={btnSt('#ef4444', true)}
            >
              🗑
            </button>
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

      {/* Chapters section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Главы ({chapters.length})
          </p>
          <button onClick={() => setAddingChapter(true)} style={btnSt('#3b82f6', true)}>+ Добавить главу</button>
        </div>

        {addingChapter && (
          <ChapterForm
            onSave={async body => { await api.createVirusChapter(data.id, body); await reload(); setAddingChapter(false); }}
            onCancel={() => setAddingChapter(false)}
          />
        )}

        {chapters.map(chapter => (
          <ChapterItem key={chapter.id} chapter={chapter} onUpdate={reload} />
        ))}

        {!chapters.length && !addingChapter && (
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Глав нет. Добавьте первую главу для этого случая.</p>
        )}
      </div>
    </div>
  );
}

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
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Управление случаями и главами нарративной игры</p>
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
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Глав</th>
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
              <td style={{ padding: '10px 12px' }}>{(c.chapters ?? []).length}</td>
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
