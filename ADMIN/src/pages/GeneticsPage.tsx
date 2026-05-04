import { useEffect, useState } from 'react';
import { api, AdminGeneticScenario, AdminGeneticStep, AdminGeneticOption } from '../api';

const DIFFICULTIES = [
  { value: 'easy', label: 'Лёгкий', color: '#27ae60' },
  { value: 'medium', label: 'Средний', color: '#f39c12' },
  { value: 'hard', label: 'Сложный', color: '#e74c3c' },
] as const;

const STEP_TYPES = [
  { value: 'info', label: 'Информация', icon: '📖', color: '#2980b9' },
  { value: 'question', label: 'Вопрос', icon: '❓', color: '#8e44ad' },
  { value: 'result', label: 'Итог', icon: '🏁', color: '#27ae60' },
] as const;

type Difficulty = typeof DIFFICULTIES[number]['value'];
type StepType = typeof STEP_TYPES[number]['value'];

function stepTypeMeta(t: string) {
  return STEP_TYPES.find(s => s.value === t) ?? STEP_TYPES[0];
}
function diffMeta(d: string) {
  return DIFFICULTIES.find(x => x.value === d) ?? DIFFICULTIES[1];
}

// ── Forms ─────────────────────────────────────────────────────────────────────
function emptyScenario() {
  return { title: '', description: '', difficulty: 'medium' as Difficulty, coins_reward: 10, is_active: true, order_index: 0 };
}
function emptyStep(order_index = 0) {
  return { title: '', content: '', step_type: 'info' as StepType, points: 0, explanation: '', order_index };
}
function emptyOption() {
  return { option_text: '', is_correct: false, feedback: '' };
}

// =============================================================================
export default function GeneticsPage() {
  const [scenarios, setScenarios] = useState<AdminGeneticScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // selected scenario detail (with steps)
  const [selected, setSelected] = useState<AdminGeneticScenario | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create scenario form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyScenario());
  const [createSaving, setCreateSaving] = useState(false);

  // Edit scenario
  const [editScenario, setEditScenario] = useState(false);
  const [editScenarioForm, setEditScenarioForm] = useState(emptyScenario());
  const [editScenarioSaving, setEditScenarioSaving] = useState(false);

  // Add step
  const [showAddStep, setShowAddStep] = useState(false);
  const [addStepForm, setAddStepForm] = useState(emptyStep());
  const [addStepSaving, setAddStepSaving] = useState(false);

  // Edit step
  const [editingStep, setEditingStep] = useState<AdminGeneticStep | null>(null);
  const [editStepForm, setEditStepForm] = useState(emptyStep());
  const [editStepSaving, setEditStepSaving] = useState(false);

  // Add option
  const [addingOptionFor, setAddingOptionFor] = useState<number | null>(null); // stepId
  const [addOptionForm, setAddOptionForm] = useState(emptyOption());
  const [addOptionSaving, setAddOptionSaving] = useState(false);

  // Edit option
  const [editingOption, setEditingOption] = useState<AdminGeneticOption | null>(null);
  const [editOptionForm, setEditOptionForm] = useState(emptyOption());
  const [editOptionSaving, setEditOptionSaving] = useState(false);

  // ── Load ────────────────────────────────────────────────────────────────────
  async function loadScenarios() {
    setLoading(true);
    try {
      const data = await api.getGeneticScenarios();
      setScenarios(data.scenarios);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: number) {
    setDetailLoading(true);
    try {
      const data = await api.getGeneticScenario(id);
      setSelected(data.scenario);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => { loadScenarios(); }, []);

  // ── Scenario CRUD ───────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateSaving(true);
    try {
      await api.createGeneticScenario({
        title: createForm.title,
        description: createForm.description || undefined,
        difficulty: createForm.difficulty,
        coins_reward: Number(createForm.coins_reward),
        is_active: createForm.is_active,
        order_index: Number(createForm.order_index),
      });
      setCreateForm(emptyScenario());
      setShowCreate(false);
      await loadScenarios();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setCreateSaving(false);
    }
  }

  async function handleUpdateScenario(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setEditScenarioSaving(true);
    try {
      await api.updateGeneticScenario(selected.id, {
        title: editScenarioForm.title,
        description: editScenarioForm.description || null,
        difficulty: editScenarioForm.difficulty,
        coins_reward: Number(editScenarioForm.coins_reward),
        is_active: editScenarioForm.is_active,
        order_index: Number(editScenarioForm.order_index),
      });
      setEditScenario(false);
      await loadDetail(selected.id);
      await loadScenarios();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setEditScenarioSaving(false);
    }
  }

  async function handleDeleteScenario(id: number) {
    if (!confirm('Удалить сценарий со всеми шагами?')) return;
    try {
      await api.deleteGeneticScenario(id);
      if (selected?.id === id) setSelected(null);
      await loadScenarios();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  // ── Step CRUD ───────────────────────────────────────────────────────────────
  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setAddStepSaving(true);
    try {
      const nextOrder = (selected.steps?.length ?? 0);
      await api.createGeneticStep(selected.id, {
        step_type: addStepForm.step_type,
        title: addStepForm.title,
        content: addStepForm.content,
        points: Number(addStepForm.points),
        explanation: addStepForm.explanation || undefined,
        order_index: nextOrder,
      });
      setAddStepForm(emptyStep());
      setShowAddStep(false);
      await loadDetail(selected.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setAddStepSaving(false);
    }
  }

  async function handleUpdateStep(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStep || !selected) return;
    setEditStepSaving(true);
    try {
      await api.updateGeneticStep(editingStep.id, {
        step_type: editStepForm.step_type,
        title: editStepForm.title,
        content: editStepForm.content,
        points: Number(editStepForm.points),
        explanation: editStepForm.explanation || null,
      });
      setEditingStep(null);
      await loadDetail(selected.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setEditStepSaving(false);
    }
  }

  async function handleDeleteStep(stepId: number) {
    if (!selected || !confirm('Удалить шаг со всеми вариантами ответов?')) return;
    try {
      await api.deleteGeneticStep(stepId);
      await loadDetail(selected.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  async function handleMoveStep(step: AdminGeneticStep, dir: 'up' | 'down') {
    if (!selected) return;
    const steps = [...(selected.steps ?? [])].sort((a, b) => a.order_index - b.order_index);
    const idx = steps.findIndex(s => s.id === step.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= steps.length) return;
    try {
      await api.updateGeneticStep(steps[idx].id, { order_index: swapIdx });
      await api.updateGeneticStep(steps[swapIdx].id, { order_index: idx });
      await loadDetail(selected.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  // ── Option CRUD ─────────────────────────────────────────────────────────────
  async function handleAddOption(e: React.FormEvent, stepId: number) {
    e.preventDefault();
    if (!selected) return;
    setAddOptionSaving(true);
    try {
      const step = selected.steps?.find(s => s.id === stepId);
      await api.createGeneticOption(stepId, {
        option_text: addOptionForm.option_text,
        is_correct: addOptionForm.is_correct,
        feedback: addOptionForm.feedback || undefined,
        order_index: step?.options?.length ?? 0,
      });
      setAddOptionForm(emptyOption());
      setAddingOptionFor(null);
      await loadDetail(selected.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setAddOptionSaving(false);
    }
  }

  async function handleUpdateOption(e: React.FormEvent) {
    e.preventDefault();
    if (!editingOption || !selected) return;
    setEditOptionSaving(true);
    try {
      await api.updateGeneticOption(editingOption.id, {
        option_text: editOptionForm.option_text,
        is_correct: editOptionForm.is_correct,
        feedback: editOptionForm.feedback || null,
      });
      setEditingOption(null);
      await loadDetail(selected.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setEditOptionSaving(false);
    }
  }

  async function handleDeleteOption(optionId: number) {
    if (!selected || !confirm('Удалить вариант ответа?')) return;
    try {
      await api.deleteGeneticOption(optionId);
      await loadDetail(selected.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <p>Загрузка...</p>;
  if (error) return <p className="error">{error}</p>;

  // If a scenario is selected, show its visual editor
  if (selected) {
    const dm = diffMeta(selected.difficulty);
    const steps = [...(selected.steps ?? [])].sort((a, b) => a.order_index - b.order_index);

    return (
      <div>
        {/* Back + header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => setSelected(null)}>
            ← Назад
          </button>
          <h1 style={{ margin: 0, flex: 1 }}>{selected.title}</h1>
          <button className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => {
            setEditScenario(true);
            setEditScenarioForm({
              title: selected.title,
              description: selected.description ?? '',
              difficulty: selected.difficulty as Difficulty,
              coins_reward: selected.coins_reward,
              is_active: selected.is_active,
              order_index: selected.order_index,
            });
          }}>
            Редактировать
          </button>
          <button className="btn btn-danger" onClick={() => handleDeleteScenario(selected.id)}>Удалить</button>
        </div>

        {/* Edit scenario form */}
        {editScenario && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ marginTop: 0 }}>Редактировать сценарий</h2>
            <form onSubmit={handleUpdateScenario}>
              <ScenarioFormFields form={editScenarioForm} setForm={setEditScenarioForm} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" disabled={editScenarioSaving}>{editScenarioSaving ? '...' : 'Сохранить'}</button>
                <button type="button" className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => setEditScenario(false)}>Отмена</button>
              </div>
            </form>
          </div>
        )}

        {/* Scenario meta */}
        {!editScenario && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: dm.color + '22', color: dm.color }}>{dm.label}</span>
            <span className="badge" style={{ background: '#fff3cd', color: '#856404' }}>🪙 {selected.coins_reward} монет</span>
            <span className="badge" style={{ background: selected.is_active ? '#d4edda' : '#f8d7da', color: selected.is_active ? '#155724' : '#721c24' }}>
              {selected.is_active ? 'Активен' : 'Скрыт'}
            </span>
            {selected.description && <span className="text-muted" style={{ fontSize: 13 }}>{selected.description}</span>}
          </div>
        )}

        {/* ── Visual step flow ── */}
        <div style={{ position: 'relative' }}>
          {steps.map((step, idx) => {
            const sm = stepTypeMeta(step.step_type);
            const isEditing = editingStep?.id === step.id;
            return (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Step card */}
                <div style={{
                  width: '100%',
                  maxWidth: 640,
                  border: `2px solid ${sm.color}`,
                  borderRadius: 14,
                  background: '#fff',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  {/* Step header */}
                  <div style={{ background: sm.color + '18', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{sm.icon}</span>
                    <span style={{ fontWeight: 700, flex: 1 }}>
                      <span style={{ color: sm.color, marginRight: 6 }}>Шаг {idx + 1}</span>
                      {step.title}
                    </span>
                    <span className="badge" style={{ background: sm.color + '22', color: sm.color, marginRight: 4 }}>{sm.label}</span>
                    {step.step_type === 'question' && (
                      <span className="badge" style={{ background: '#fff3cd', color: '#856404', marginRight: 4 }}>{step.points} очк.</span>
                    )}
                    {/* Move up/down */}
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#eee', color: '#555', padding: '2px 7px' }}
                        onClick={() => handleMoveStep(step, 'up')}
                        disabled={idx === 0}
                        title="Выше"
                      >↑</button>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#eee', color: '#555', padding: '2px 7px' }}
                        onClick={() => handleMoveStep(step, 'down')}
                        disabled={idx === steps.length - 1}
                        title="Ниже"
                      >↓</button>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#e8f0fe', color: '#1a73e8', marginLeft: 4 }}
                        onClick={() => { setEditingStep(step); setEditStepForm({ title: step.title, content: step.content, step_type: step.step_type as StepType, points: step.points, explanation: step.explanation ?? '', order_index: step.order_index }); }}
                      >Ред.</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStep(step.id)}>✕</button>
                    </div>
                  </div>

                  {/* Edit step form */}
                  {isEditing ? (
                    <div style={{ padding: '12px 14px' }}>
                      <form onSubmit={handleUpdateStep}>
                        <StepFormFields form={editStepForm} setForm={setEditStepForm} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button type="submit" className="btn btn-primary btn-sm" disabled={editStepSaving}>{editStepSaving ? '...' : 'Сохранить'}</button>
                          <button type="button" className="btn btn-sm" style={{ background: '#eee', color: '#333' }} onClick={() => setEditingStep(null)}>Отмена</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap', color: '#333' }}>{step.content}</p>
                      {step.explanation && (
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                          Пояснение: {step.explanation}
                        </p>
                      )}

                      {/* Options for question steps */}
                      {step.step_type === 'question' && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Варианты ответов
                          </div>
                          {(step.options ?? []).map(opt => (
                            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              {editingOption?.id === opt.id ? (
                                <form onSubmit={handleUpdateOption} style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <input
                                    value={editOptionForm.option_text}
                                    onChange={e => setEditOptionForm(f => ({ ...f, option_text: e.target.value }))}
                                    style={{ flex: '2 1 160px', border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}
                                    required
                                  />
                                  <input
                                    value={editOptionForm.feedback}
                                    onChange={e => setEditOptionForm(f => ({ ...f, feedback: e.target.value }))}
                                    placeholder="Фидбэк при неверном ответе"
                                    style={{ flex: '2 1 160px', border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}
                                  />
                                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    <input type="checkbox" checked={editOptionForm.is_correct} onChange={e => setEditOptionForm(f => ({ ...f, is_correct: e.target.checked }))} />
                                    Верный
                                  </label>
                                  <button type="submit" className="btn btn-primary btn-sm" disabled={editOptionSaving}>{editOptionSaving ? '...' : 'Ок'}</button>
                                  <button type="button" className="btn btn-sm" style={{ background: '#eee', color: '#333' }} onClick={() => setEditingOption(null)}>✕</button>
                                </form>
                              ) : (
                                <>
                                  <span style={{
                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                    background: opt.is_correct ? '#27ae60' : '#e0e0e0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, color: opt.is_correct ? '#fff' : '#999',
                                  }}>
                                    {opt.is_correct ? '✓' : '✗'}
                                  </span>
                                  <span style={{ flex: 1, fontSize: 13 }}>{opt.option_text}</span>
                                  {opt.feedback && <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>"{opt.feedback}"</span>}
                                  <button className="btn btn-sm" style={{ background: '#eee', color: '#333' }} onClick={() => { setEditingOption(opt); setEditOptionForm({ option_text: opt.option_text, is_correct: opt.is_correct, feedback: opt.feedback ?? '' }); }}>Ред.</button>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOption(opt.id)}>✕</button>
                                </>
                              )}
                            </div>
                          ))}

                          {/* Add option inline */}
                          {addingOptionFor === step.id ? (
                            <form onSubmit={e => handleAddOption(e, step.id)} style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <input
                                value={addOptionForm.option_text}
                                onChange={e => setAddOptionForm(f => ({ ...f, option_text: e.target.value }))}
                                placeholder="Текст варианта *"
                                style={{ flex: '2 1 140px', border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}
                                required
                                autoFocus
                              />
                              <input
                                value={addOptionForm.feedback}
                                onChange={e => setAddOptionForm(f => ({ ...f, feedback: e.target.value }))}
                                placeholder="Фидбэк при неверном ответе"
                                style={{ flex: '2 1 160px', border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}
                              />
                              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <input type="checkbox" checked={addOptionForm.is_correct} onChange={e => setAddOptionForm(f => ({ ...f, is_correct: e.target.checked }))} />
                                Верный
                              </label>
                              <button type="submit" className="btn btn-primary btn-sm" disabled={addOptionSaving}>{addOptionSaving ? '...' : '+ Добавить'}</button>
                              <button type="button" className="btn btn-sm" style={{ background: '#eee', color: '#333' }} onClick={() => setAddingOptionFor(null)}>Отмена</button>
                            </form>
                          ) : (
                            <button
                              className="btn btn-sm"
                              style={{ marginTop: 6, background: '#f0f0f0', color: '#444' }}
                              onClick={() => { setAddingOptionFor(step.id); setAddOptionForm(emptyOption()); setEditingOption(null); }}
                            >
                              + Вариант ответа
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Arrow connector */}
                {idx < steps.length - 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0', color: '#bbb', fontSize: 22, lineHeight: 1 }}>
                    │<br />↓
                  </div>
                )}
              </div>
            );
          })}

          {/* Add step button at the bottom of flow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: steps.length > 0 ? 8 : 0 }}>
            {steps.length > 0 && (
              <div style={{ color: '#bbb', fontSize: 22, lineHeight: 1, marginBottom: 8 }}>│<br />↓</div>
            )}
            {showAddStep ? (
              <div className="card" style={{ width: '100%', maxWidth: 640 }}>
                <h3 style={{ marginTop: 0 }}>Новый шаг</h3>
                <form onSubmit={handleAddStep}>
                  <StepFormFields form={addStepForm} setForm={setAddStepForm} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button type="submit" className="btn btn-primary" disabled={addStepSaving}>{addStepSaving ? '...' : 'Добавить шаг'}</button>
                    <button type="button" className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => setShowAddStep(false)}>Отмена</button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                style={{ borderRadius: 30, padding: '8px 20px' }}
                onClick={() => { setShowAddStep(true); setAddStepForm(emptyStep(steps.length)); }}
              >
                + Добавить шаг
              </button>
            )}
          </div>

          {detailLoading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
              Загрузка...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Scenario list ──────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Генетика — сценарии ({scenarios.length})</h1>
        <button className="btn btn-primary" onClick={() => { setShowCreate(v => !v); }}>
          {showCreate ? 'Отмена' : '+ Создать сценарий'}
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>Новый сценарий</h2>
          <form onSubmit={handleCreate}>
            <ScenarioFormFields form={createForm} setForm={setCreateForm} />
            <div style={{ marginTop: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={createSaving}>{createSaving ? 'Создание...' : 'Создать'}</button>
            </div>
          </form>
        </div>
      )}

      {scenarios.length === 0 && !showCreate && <p className="text-muted">Сценариев нет. Создайте первый.</p>}

      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Сложность</th>
            <th>Монеты</th>
            <th>Шагов</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map(s => {
            const dm = diffMeta(s.difficulty);
            return (
              <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => loadDetail(s.id)}>
                <td><strong>{s.title}</strong>{s.description && <div className="text-muted" style={{ fontSize: 12 }}>{s.description}</div>}</td>
                <td><span className="badge" style={{ background: dm.color + '22', color: dm.color }}>{dm.label}</span></td>
                <td>{s.coins_reward}</td>
                <td>{(s.steps as any)?.length ?? '—'}</td>
                <td>
                  <span className="badge" style={{ background: s.is_active ? '#d4edda' : '#f8d7da', color: s.is_active ? '#155724' : '#721c24' }}>
                    {s.is_active ? 'Активен' : 'Скрыт'}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteScenario(s.id)}>Удалить</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Sub-forms ─────────────────────────────────────────────────────────────────
type ScenarioForm = ReturnType<typeof emptyScenario>;
type StepForm = ReturnType<typeof emptyStep>;

function ScenarioFormFields({ form, setForm }: { form: ScenarioForm; setForm: React.Dispatch<React.SetStateAction<ScenarioForm>> }) {
  return (
    <div className="form-row">
      <label style={{ flex: '2 1 200px' }}>
        Название *
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Моногибридное скрещивание" />
      </label>
      <label style={{ flex: '1 1 120px' }}>
        Сложность
        <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}>
          {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </label>
      <label style={{ flex: '0 1 90px' }}>
        Монеты
        <input type="number" min={0} value={form.coins_reward} onChange={e => setForm(f => ({ ...f, coins_reward: Number(e.target.value) }))} />
      </label>
      <label style={{ flex: '0 1 70px' }}>
        Порядок
        <input type="number" min={0} value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))} />
      </label>
      <label style={{ flex: '2 1 240px' }}>
        Описание
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Краткое описание задачи" />
      </label>
      <label style={{ flex: '0 1 80px', alignSelf: 'flex-end', paddingBottom: 6 }}>
        <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ marginRight: 6 }} />
        Активен
      </label>
    </div>
  );
}

function StepFormFields({ form, setForm }: { form: StepForm; setForm: React.Dispatch<React.SetStateAction<StepForm>> }) {
  return (
    <div className="form-row">
      <label style={{ flex: '1 1 120px' }}>
        Тип шага *
        <select value={form.step_type} onChange={e => setForm(f => ({ ...f, step_type: e.target.value as StepType }))}>
          {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
        </select>
      </label>
      <label style={{ flex: '2 1 200px' }}>
        Заголовок *
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Условие задачи" />
      </label>
      {form.step_type === 'question' && (
        <label style={{ flex: '0 1 80px' }}>
          Очки
          <input type="number" min={0} value={form.points} onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))} />
        </label>
      )}
      <label style={{ flex: '3 1 280px' }}>
        Содержание *
        <textarea
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          required
          placeholder="Текст карточки (можно использовать переносы строк)"
          style={{ minHeight: 72, resize: 'vertical', border: '1px solid #ddd', borderRadius: 4, padding: '6px 8px', fontSize: 13, width: '100%', fontFamily: 'inherit' }}
        />
      </label>
      <label style={{ flex: '2 1 220px' }}>
        Пояснение (после ответа)
        <input value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Объяснение правильного ответа" />
      </label>
    </div>
  );
}
