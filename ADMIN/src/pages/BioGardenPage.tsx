import { useEffect, useState } from 'react';
import { api, AdminBioGardenPlant, AdminBioGardenQuestion, AdminBioGardenOption } from '../api';

// ── Shared styles ─────────────────────────────────────────────────────────────

const btn = (color: string, small = false): React.CSSProperties => ({
  background: color, color: '#fff', border: 'none', borderRadius: 6,
  padding: small ? '5px 10px' : '8px 16px', fontSize: small ? 12 : 13,
  fontWeight: 600, cursor: 'pointer',
});
const smallBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 4px', opacity: 0.7 };
const inputSt: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };
const labelSt: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 };
const fieldWrap: React.CSSProperties = { marginBottom: 10 };

// ── PlantForm ─────────────────────────────────────────────────────────────────

function PlantForm({ initial, onSave, onCancel }: {
  initial?: Partial<AdminBioGardenPlant>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    scientific_name: initial?.scientific_name ?? '',
    description: initial?.description ?? '',
    image_url: initial?.image_url ?? '',
    growth_stages: String(initial?.growth_stages ?? 5),
    required_experience: String(initial?.required_experience ?? 0),
    difficulty_level: String(initial?.difficulty_level ?? 1),
    biology_topics: (initial?.biology_topics ?? []).join(', '),
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.scientific_name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name, scientific_name: form.scientific_name,
        description: form.description, image_url: form.image_url || null,
        growth_stages: Number(form.growth_stages),
        required_experience: Number(form.required_experience),
        difficulty_level: Number(form.difficulty_level),
        biology_topics: form.biology_topics.split(',').map(s => s.trim()).filter(Boolean),
        is_active: form.is_active,
      });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={fieldWrap}>
          <label style={labelSt}>Название *</label>
          <input value={form.name} onChange={f('name')} style={inputSt} />
        </div>
        <div style={fieldWrap}>
          <label style={labelSt}>Латинское название *</label>
          <input value={form.scientific_name} onChange={f('scientific_name')} style={inputSt} />
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={labelSt}>Описание (поддерживает переносы строк, "- " для списков, "Заголовок:" для разделов)</label>
        <textarea value={form.description} onChange={f('description')} style={{ ...inputSt, minHeight: 100, resize: 'vertical' }} />
      </div>
      <div style={fieldWrap}>
        <label style={labelSt}>URL изображения</label>
        <input value={form.image_url} onChange={f('image_url')} placeholder="https://..." style={inputSt} />
        {form.image_url && (
          <img src={form.image_url} alt="" style={{ marginTop: 6, maxHeight: 80, maxWidth: 120, borderRadius: 4, objectFit: 'cover', border: '1px solid #e5e7eb' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div style={fieldWrap}>
          <label style={labelSt}>Стадий роста</label>
          <input type="number" min={1} max={20} value={form.growth_stages} onChange={f('growth_stages')} style={inputSt} />
        </div>
        <div style={fieldWrap}>
          <label style={labelSt}>Уровень сложности (1–10)</label>
          <input type="number" min={1} max={10} value={form.difficulty_level} onChange={f('difficulty_level')} style={inputSt} />
        </div>
        <div style={fieldWrap}>
          <label style={labelSt}>Требуемый опыт</label>
          <input type="number" min={0} value={form.required_experience} onChange={f('required_experience')} style={inputSt} />
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={labelSt}>Темы биологии (через запятую)</label>
        <input value={form.biology_topics} onChange={f('biology_topics')} placeholder="Генетика, Ботаника" style={inputSt} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ marginRight: 6 }} />
          Активно (видно в игре)
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={btn('#22c55e')}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
        <button onClick={onCancel} style={btn('#6b7280')}>Отмена</button>
      </div>
    </div>
  );
}

// ── QuestionForm ──────────────────────────────────────────────────────────────

function QuestionForm({ initial, onSave, onCancel }: {
  initial?: Partial<AdminBioGardenQuestion>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    question_text: initial?.question_text ?? '',
    explanation: initial?.explanation ?? '',
    biology_topic: initial?.biology_topic ?? '',
    ege_code: initial?.ege_code ?? '',
    points: String(initial?.points ?? 10),
    difficulty_level: String(initial?.difficulty_level ?? 1),
    timer_seconds: String(initial?.timer_seconds ?? 60),
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.question_text.trim()) return;
    setSaving(true);
    try {
      await onSave({
        question_text: form.question_text, explanation: form.explanation,
        biology_topic: form.biology_topic, ege_code: form.ege_code,
        points: Number(form.points), difficulty_level: Number(form.difficulty_level),
        timer_seconds: Number(form.timer_seconds), is_active: form.is_active,
      });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: 14, marginBottom: 10 }}>
      <div style={fieldWrap}>
        <label style={labelSt}>Текст вопроса *</label>
        <textarea value={form.question_text} onChange={f('question_text')} style={{ ...inputSt, minHeight: 60, resize: 'vertical' }} />
      </div>
      <div style={fieldWrap}>
        <label style={labelSt}>Объяснение ответа</label>
        <textarea value={form.explanation} onChange={f('explanation')} style={{ ...inputSt, minHeight: 50, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        <div style={fieldWrap}>
          <label style={labelSt}>Тема</label>
          <input value={form.biology_topic} onChange={f('biology_topic')} style={inputSt} />
        </div>
        <div style={fieldWrap}>
          <label style={labelSt}>Код ЕГЭ</label>
          <input value={form.ege_code} onChange={f('ege_code')} placeholder="1.1" style={inputSt} />
        </div>
        <div style={fieldWrap}>
          <label style={labelSt}>Баллы</label>
          <input type="number" value={form.points} onChange={f('points')} style={inputSt} />
        </div>
        <div style={fieldWrap}>
          <label style={labelSt}>Сложность (1–10)</label>
          <input type="number" min={1} max={10} value={form.difficulty_level} onChange={f('difficulty_level')} style={inputSt} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <div>
          <label style={labelSt}>Таймер (сек)</label>
          <input type="number" value={form.timer_seconds} onChange={f('timer_seconds')} style={{ ...inputSt, width: 80 }} />
        </div>
        <div style={{ marginTop: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ marginRight: 6 }} />
            Активен
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={btn('#8b5cf6', true)}>{saving ? '...' : 'Сохранить'}</button>
        <button onClick={onCancel} style={btn('#6b7280', true)}>Отмена</button>
      </div>
    </div>
  );
}

// ── OptionRow ─────────────────────────────────────────────────────────────────

function OptionRow({ option, onUpdate, onDelete }: {
  option: AdminBioGardenOption;
  onUpdate: (id: number, data: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(option.option_text);
  const [correct, setCorrect] = useState(option.is_correct);
  const [saving, setSaving] = useState(false);

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <input value={text} onChange={e => setText(e.target.value)} style={{ ...inputSt, flex: 1 }} />
        <label style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={correct} onChange={e => setCorrect(e.target.checked)} style={{ marginRight: 4 }} />
          Верный
        </label>
        <button style={btn('#3b82f6', true)} disabled={saving} onClick={async () => { setSaving(true); await onUpdate(option.id, { option_text: text, is_correct: correct }); setSaving(false); setEditing(false); }}>{saving ? '...' : '✓'}</button>
        <button style={btn('#6b7280', true)} onClick={() => setEditing(false)}>✕</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: option.is_correct ? '#f0fdf4' : '#fafafa', borderRadius: 6, marginBottom: 4, border: `1px solid ${option.is_correct ? '#bbf7d0' : '#e5e7eb'}` }}>
      <span style={{ fontSize: 16 }}>{option.is_correct ? '✅' : '◯'}</span>
      <span style={{ flex: 1, fontSize: 13 }}>{option.option_text}</span>
      <button onClick={() => setEditing(true)} style={smallBtn}>✏️</button>
      <button onClick={() => onDelete(option.id)} style={{ ...smallBtn, color: '#ef4444' }}>🗑</button>
    </div>
  );
}

// ── QuestionBlock ─────────────────────────────────────────────────────────────

function QuestionBlock({ question, plantId, onRefresh }: {
  question: AdminBioGardenQuestion;
  plantId: number;
  onRefresh: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingOption, setAddingOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const [newOptionCorrect, setNewOptionCorrect] = useState(false);

  const options = question.options ?? [];

  return (
    <div style={{ border: '1px solid #e9d5ff', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
      <div
        style={{ background: '#faf5ff', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 12, color: '#6b7280', minWidth: 20 }}>{open ? '▾' : '▸'}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{question.question_text}</span>
        <span style={{ fontSize: 11, color: '#8b5cf6', background: '#ede9fe', borderRadius: 4, padding: '2px 6px' }}>
          {options.length} вар. · {question.points}б · ур.{question.difficulty_level}
        </span>
        {!question.is_active && <span style={{ fontSize: 11, color: '#9ca3af' }}>скрыт</span>}
        <button onClick={e => { e.stopPropagation(); setEditing(v => !v); }} style={smallBtn}>✏️</button>
        <button onClick={async e => { e.stopPropagation(); if (confirm('Удалить вопрос?')) { await api.deleteBioGardenQuestion(question.id); await onRefresh(); } }} style={{ ...smallBtn, color: '#ef4444' }}>🗑</button>
      </div>

      {(open || editing) && (
        <div style={{ padding: '12px 14px' }}>
          {editing && (
            <QuestionForm
              initial={question}
              onSave={async body => { await api.updateBioGardenQuestion(question.id, body); await onRefresh(); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          )}

          {open && !editing && (
            <>
              {question.explanation && (
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, padding: '6px 10px', background: '#f9fafb', borderRadius: 6 }}>
                  <b>Объяснение:</b> {question.explanation}
                </div>
              )}
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                Тема: <b>{question.biology_topic || '—'}</b> · ЕГЭ: <b>{question.ege_code || '—'}</b> · ⏱ {question.timer_seconds}с
              </div>

              <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>Варианты ответов:</p>
              {options.map(opt => (
                <OptionRow
                  key={opt.id}
                  option={opt}
                  onUpdate={async (id, data) => { await api.updateBioGardenOption(id, data); await onRefresh(); }}
                  onDelete={async id => { await api.deleteBioGardenOption(id); await onRefresh(); }}
                />
              ))}

              {addingOption ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                  <input value={newOptionText} onChange={e => setNewOptionText(e.target.value)} placeholder="Текст варианта" style={{ ...inputSt, flex: 1 }} />
                  <label style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={newOptionCorrect} onChange={e => setNewOptionCorrect(e.target.checked)} style={{ marginRight: 4 }} />
                    Верный
                  </label>
                  <button style={btn('#22c55e', true)} onClick={async () => {
                    if (!newOptionText.trim()) return;
                    await api.createBioGardenOption(question.id, { option_text: newOptionText, is_correct: newOptionCorrect, order_index: options.length });
                    await onRefresh();
                    setNewOptionText(''); setNewOptionCorrect(false); setAddingOption(false);
                  }}>+ Добавить</button>
                  <button style={btn('#6b7280', true)} onClick={() => setAddingOption(false)}>Отмена</button>
                </div>
              ) : (
                <button onClick={() => setAddingOption(true)} style={{ ...btn('#3b82f6', true), marginTop: 6 }}>+ Вариант ответа</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── PlantDetail ───────────────────────────────────────────────────────────────

function PlantDetail({ plant: initial, onBack, onRefresh }: {
  plant: AdminBioGardenPlant;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [plant, setPlant] = useState<AdminBioGardenPlant>(initial);
  const [editingPlant, setEditingPlant] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);

  const reload = async () => {
    const res = await api.getBioGardenPlant(plant.id);
    setPlant(res.plant);
    onRefresh();
  };

  const questions = plant.questions ?? [];

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, marginBottom: 16, padding: 0 }}>
        ← Назад к списку
      </button>

      {/* Plant card */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {plant.image_url && (
            <img src={plant.image_url} alt={plant.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e7eb', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 800 }}>{plant.name}</h2>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>{plant.scientific_name}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>ур. {plant.difficulty_level}</span>
              <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{plant.growth_stages} стадий</span>
              <span style={{ background: plant.is_active ? '#dcfce7' : '#fee2e2', color: plant.is_active ? '#166534' : '#991b1b', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{plant.is_active ? '● Активно' : '○ Скрыто'}</span>
              {(plant.biology_topics ?? []).map(t => (
                <span key={t} style={{ background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{t}</span>
              ))}
            </div>
            {plant.description && (
              <p style={{ margin: 0, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', lineClamp: 3 }}>{plant.description.slice(0, 200)}{plant.description.length > 200 ? '...' : ''}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setEditingPlant(v => !v)} style={btn('#6b7280', true)}>✏️ Изменить</button>
            <button onClick={async () => { if (confirm('Удалить растение и все его вопросы?')) { await api.deleteBioGardenPlant(plant.id); onBack(); onRefresh(); } }} style={btn('#ef4444', true)}>🗑</button>
          </div>
        </div>

        {editingPlant && (
          <div style={{ marginTop: 14 }}>
            <PlantForm
              initial={plant}
              onSave={async body => { await api.updateBioGardenPlant(plant.id, body); await reload(); setEditingPlant(false); }}
              onCancel={() => setEditingPlant(false)}
            />
          </div>
        )}
      </div>

      {/* Questions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Вопросы ({questions.length})</h3>
          <button onClick={() => setAddingQuestion(v => !v)} style={btn('#8b5cf6', true)}>+ Добавить вопрос</button>
        </div>

        {addingQuestion && (
          <QuestionForm
            onSave={async body => { await api.createBioGardenQuestion(plant.id, body); await reload(); setAddingQuestion(false); }}
            onCancel={() => setAddingQuestion(false)}
          />
        )}

        {questions.length === 0 && !addingQuestion && (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Вопросов нет. Добавьте вопросы для этого растения.</p>
        )}

        {questions.map(q => (
          <QuestionBlock key={q.id} question={q} plantId={plant.id} onRefresh={reload} />
        ))}
      </div>
    </div>
  );
}

// ── BioGardenPage ─────────────────────────────────────────────────────────────

export default function BioGardenPage() {
  const [plants, setPlants] = useState<AdminBioGardenPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminBioGardenPlant | null>(null);
  const [addingPlant, setAddingPlant] = useState(false);
  const [error, setError] = useState('');

  const loadPlants = async () => {
    try {
      const res = await api.getBioGardenPlants();
      setPlants(res.plants);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlants(); }, []);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  if (selected) {
    return <PlantDetail plant={selected} onBack={() => setSelected(null)} onRefresh={loadPlants} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>🌱 Биосадовник</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Управление растениями, описаниями, изображениями и вопросами</p>
        </div>
        <button onClick={() => setAddingPlant(true)} style={btn('#22c55e')}>+ Новое растение</button>
      </div>

      {addingPlant && (
        <PlantForm
          onSave={async body => { await api.createBioGardenPlant(body); await loadPlants(); setAddingPlant(false); }}
          onCancel={() => setAddingPlant(false)}
        />
      )}

      {plants.length === 0 && !addingPlant && (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Растений нет. Создайте первое!</p>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}></th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Растение</th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Уровень</th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Стадий</th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Вопросов</th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Статус</th>
            <th style={{ padding: '8px 12px' }}></th>
          </tr>
        </thead>
        <tbody>
          {plants.map(p => (
            <tr
              key={p.id}
              style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
              onClick={() => setSelected(p)}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <td style={{ padding: '8px 12px', width: 48 }}>
                {p.image_url
                  ? <img src={p.image_url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌿</div>
                }
              </td>
              <td style={{ padding: '8px 12px' }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>{p.scientific_name}</div>
              </td>
              <td style={{ padding: '8px 12px' }}>{p.difficulty_level}</td>
              <td style={{ padding: '8px 12px' }}>{p.growth_stages}</td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{ background: (p.questions_count ?? 0) > 0 ? '#dbeafe' : '#fee2e2', color: (p.questions_count ?? 0) > 0 ? '#1e40af' : '#991b1b', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                  {p.questions_count ?? 0}
                </span>
              </td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{ color: p.is_active ? '#16a34a' : '#9ca3af', fontWeight: 600 }}>{p.is_active ? '● Активно' : '○ Скрыто'}</span>
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                <button onClick={e => { e.stopPropagation(); setSelected(p); }} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
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
