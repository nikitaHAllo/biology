import { useEffect, useState } from 'react';
import { api, AdminQuiz, AdminQuizCategory, AdminQuizQuestion, AdminQuizOption } from '../api';

const DIFFICULTIES = [
  { value: 'easy', label: 'Лёгкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'hard', label: 'Сложный' },
] as const;

const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Один ответ' },
  { value: 'multiple_choice', label: 'Несколько ответов' },
  { value: 'true_false', label: 'Верно/Неверно' },
  { value: 'open_ended', label: 'Развёрнутый ответ (часть 2 ЕГЭ)' },
  { value: 'text_input', label: 'Текстовый ввод (автопроверка)' },
] as const;

type Difficulty = typeof DIFFICULTIES[number]['value'];
type QuestionType = typeof QUESTION_TYPES[number]['value'];

function difficultyLabel(d: string) {
  return DIFFICULTIES.find(x => x.value === d)?.label ?? d;
}
function difficultyColor(d: string) {
  if (d === 'easy') return '#27ae60';
  if (d === 'hard') return '#e74c3c';
  return '#f39c12';
}

// ── Quiz form ─────────────────────────────────────────────────────────────────
function emptyQuizForm(defaultCategoryId = 0) {
  return {
    title: '',
    description: '',
    coins_reward: 10,
    difficulty: 'medium' as Difficulty,
    topic_tag: '',
    estimated_minutes: '',
    is_active: true,
    category_id: defaultCategoryId,
  };
}

type QuizForm = ReturnType<typeof emptyQuizForm>;

// ── Question form ─────────────────────────────────────────────────────────────
function emptyQuestionForm() {
  return {
    question_text: '',
    question_type: 'single_choice' as QuestionType,
    points: 1,
    timer_seconds: '',
    explanation: '',
    order_index: 0,
    image_url: '',
    correct_text_answer: '',
  };
}

type QuestionForm = ReturnType<typeof emptyQuestionForm>;

// ── Option form ───────────────────────────────────────────────────────────────
function emptyOptionForm() {
  return { option_text: '', is_correct: false };
}

// =============================================================================
export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [categories, setCategories] = useState<AdminQuizCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // category management
  const [showCatCreate, setShowCatCreate] = useState(false);
  const [catForm, setCatForm] = useState({ title: '', description: '', color: 'blue', icon: '', order_index: 0 });
  const [catSaving, setCatSaving] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatForm, setEditCatForm] = useState({ title: '', description: '', color: 'blue', icon: '', order_index: 0 });

  // which quiz is expanded (shows questions)
  const [openQuizId, setOpenQuizId] = useState<number | null>(null);
  // full quiz data cache (with questions + options)
  const [quizDetails, setQuizDetails] = useState<Record<number, AdminQuiz>>({});

  // create quiz form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyQuizForm());
  const [createSaving, setCreateSaving] = useState(false);

  // edit quiz
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [editQuizForm, setEditQuizForm] = useState(emptyQuizForm());
  const [editQuizSaving, setEditQuizSaving] = useState(false);

  // add question
  const [addingQuestionFor, setAddingQuestionFor] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm());
  const [questionSaving, setQuestionSaving] = useState(false);

  // edit question
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editQuestionForm, setEditQuestionForm] = useState(emptyQuestionForm());
  const [editQuestionSaving, setEditQuestionSaving] = useState(false);

  // which question is expanded (shows options)
  const [openQuestionId, setOpenQuestionId] = useState<number | null>(null);

  // add option
  const [addingOptionFor, setAddingOptionFor] = useState<number | null>(null);
  const [optionForm, setOptionForm] = useState(emptyOptionForm());
  const [optionSaving, setOptionSaving] = useState(false);

  // edit option
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [editOptionForm, setEditOptionForm] = useState(emptyOptionForm());
  const [editOptionSaving, setEditOptionSaving] = useState(false);

  // ── Load ────────────────────────────────────────────────────────────────────
  async function load() {
    setLoading(true);
    try {
      const [quizData, catData] = await Promise.all([api.getQuizzes(), api.getQuizCategories()]);
      setQuizzes(quizData.quizzes);
      setCategories(catData.categories);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  // ── Category CRUD ────────────────────────────────────────────────────────────
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setCatSaving(true);
    try {
      await api.createQuizCategory({
        title: catForm.title,
        description: catForm.description || undefined,
        color: catForm.color || 'blue',
        icon: catForm.icon || undefined,
        order_index: Number(catForm.order_index),
      });
      setCatForm({ title: '', description: '', color: 'blue', icon: '', order_index: 0 });
      setShowCatCreate(false);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setCatSaving(false);
    }
  }

  function startEditCat(cat: AdminQuizCategory) {
    setEditingCatId(cat.id);
    setEditCatForm({ title: cat.title, description: cat.description ?? '', color: cat.color, icon: cat.icon ?? '', order_index: cat.order_index });
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCatId) return;
    setCatSaving(true);
    try {
      await api.updateQuizCategory(editingCatId, {
        title: editCatForm.title,
        description: editCatForm.description || null,
        color: editCatForm.color,
        icon: editCatForm.icon || null,
        order_index: Number(editCatForm.order_index),
      });
      setEditingCatId(null);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setCatSaving(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Удалить категорию?')) return;
    try {
      await api.deleteQuizCategory(id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  async function loadQuizDetails(id: number) {
    try {
      const data = await api.getQuiz(id);
      setQuizDetails(prev => ({ ...prev, [id]: data.quiz }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка загрузки теста');
    }
  }

  useEffect(() => { load(); }, []);

  // ── Toggle quiz open ────────────────────────────────────────────────────────
  async function toggleQuiz(id: number) {
    if (openQuizId === id) {
      setOpenQuizId(null);
      return;
    }
    setOpenQuizId(id);
    setOpenQuestionId(null);
    if (!quizDetails[id]) {
      await loadQuizDetails(id);
    }
  }

  // ── Create quiz ─────────────────────────────────────────────────────────────
  async function handleCreateQuiz(e: React.FormEvent) {
    e.preventDefault();
    setCreateSaving(true);
    try {
      await api.createQuiz({
        title: createForm.title,
        description: createForm.description || undefined,
        coins_reward: Number(createForm.coins_reward),
        difficulty: createForm.difficulty,
        topic_tag: createForm.topic_tag || undefined,
        estimated_minutes: createForm.estimated_minutes ? Number(createForm.estimated_minutes) : undefined,
        is_active: createForm.is_active,
        category_id: createForm.category_id || undefined,
      });
      setCreateForm(emptyQuizForm());
      setShowCreate(false);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setCreateSaving(false);
    }
  }

  // ── Edit quiz ───────────────────────────────────────────────────────────────
  function startEditQuiz(quiz: AdminQuiz) {
    setEditingQuizId(quiz.id);
    setEditQuizForm({
      title: quiz.title,
      description: quiz.description ?? '',
      coins_reward: quiz.coins_reward,
      difficulty: quiz.difficulty as Difficulty,
      topic_tag: quiz.topic_tag ?? '',
      estimated_minutes: quiz.estimated_minutes?.toString() ?? '',
      is_active: quiz.is_active,
      category_id: quiz.category_id ?? 0,
    });
  }

  async function handleUpdateQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!editingQuizId) return;
    setEditQuizSaving(true);
    try {
      await api.updateQuiz(editingQuizId, {
        title: editQuizForm.title,
        description: editQuizForm.description || null,
        coins_reward: Number(editQuizForm.coins_reward),
        difficulty: editQuizForm.difficulty,
        topic_tag: editQuizForm.topic_tag || null,
        estimated_minutes: editQuizForm.estimated_minutes ? Number(editQuizForm.estimated_minutes) : null,
        is_active: editQuizForm.is_active,
        category_id: editQuizForm.category_id || undefined,
      });
      setEditingQuizId(null);
      await load();
      if (openQuizId === editingQuizId) {
        await loadQuizDetails(editingQuizId);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setEditQuizSaving(false);
    }
  }

  // ── Delete quiz ─────────────────────────────────────────────────────────────
  async function handleDeleteQuiz(id: number) {
    if (!confirm('Удалить тест со всеми вопросами и вариантами ответов?')) return;
    try {
      await api.deleteQuiz(id);
      if (openQuizId === id) setOpenQuizId(null);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  // ── Create question ─────────────────────────────────────────────────────────
  async function handleCreateQuestion(e: React.FormEvent, quizId: number) {
    e.preventDefault();
    setQuestionSaving(true);
    try {
      await api.createQuestion(quizId, {
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        points: Number(questionForm.points),
        timer_seconds: questionForm.timer_seconds ? Number(questionForm.timer_seconds) : null,
        explanation: questionForm.explanation || undefined,
        order_index: Number(questionForm.order_index),
        image_url: questionForm.image_url || null,
        correct_text_answer: questionForm.question_type === 'text_input' ? (questionForm.correct_text_answer || null) : null,
      });
      setQuestionForm(emptyQuestionForm());
      setAddingQuestionFor(null);
      await loadQuizDetails(quizId);
      // update total_questions count in list
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setQuestionSaving(false);
    }
  }

  // ── Edit question ───────────────────────────────────────────────────────────
  function startEditQuestion(q: AdminQuizQuestion) {
    setEditingQuestionId(q.id);
    setEditQuestionForm({
      question_text: q.question_text,
      question_type: q.question_type as QuestionType,
      points: q.points,
      timer_seconds: q.timer_seconds?.toString() ?? '',
      explanation: q.explanation ?? '',
      order_index: q.order_index,
      image_url: q.image_url ?? '',
      correct_text_answer: q.correct_text_answer ?? '',
    });
  }

  async function handleUpdateQuestion(e: React.FormEvent, quizId: number) {
    e.preventDefault();
    if (!editingQuestionId) return;
    setEditQuestionSaving(true);
    try {
      await api.updateQuestion(editingQuestionId, {
        question_text: editQuestionForm.question_text,
        question_type: editQuestionForm.question_type,
        points: Number(editQuestionForm.points),
        timer_seconds: editQuestionForm.timer_seconds ? Number(editQuestionForm.timer_seconds) : null,
        explanation: editQuestionForm.explanation || null,
        order_index: Number(editQuestionForm.order_index),
        image_url: editQuestionForm.image_url || null,
        correct_text_answer: editQuestionForm.question_type === 'text_input' ? (editQuestionForm.correct_text_answer || null) : null,
      });
      setEditingQuestionId(null);
      await loadQuizDetails(quizId);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setEditQuestionSaving(false);
    }
  }

  // ── Delete question ─────────────────────────────────────────────────────────
  async function handleDeleteQuestion(questionId: number, quizId: number) {
    if (!confirm('Удалить вопрос со всеми вариантами ответов?')) return;
    try {
      await api.deleteQuestion(questionId);
      await loadQuizDetails(quizId);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  // ── Create option ───────────────────────────────────────────────────────────
  async function handleCreateOption(e: React.FormEvent, questionId: number, quizId: number) {
    e.preventDefault();
    setOptionSaving(true);
    try {
      await api.createOption(questionId, {
        option_text: optionForm.option_text,
        is_correct: optionForm.is_correct,
        order_index: (quizDetails[quizId]?.questions?.find(q => q.id === questionId)?.options?.length ?? 0),
      });
      setOptionForm(emptyOptionForm());
      setAddingOptionFor(null);
      await loadQuizDetails(quizId);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setOptionSaving(false);
    }
  }

  // ── Edit option ─────────────────────────────────────────────────────────────
  function startEditOption(opt: AdminQuizOption) {
    setEditingOptionId(opt.id);
    setEditOptionForm({ option_text: opt.option_text, is_correct: opt.is_correct });
  }

  async function handleUpdateOption(e: React.FormEvent, quizId: number) {
    e.preventDefault();
    if (!editingOptionId) return;
    setEditOptionSaving(true);
    try {
      await api.updateOption(editingOptionId, {
        option_text: editOptionForm.option_text,
        is_correct: editOptionForm.is_correct,
      });
      setEditingOptionId(null);
      await loadQuizDetails(quizId);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setEditOptionSaving(false);
    }
  }

  // ── Delete option ───────────────────────────────────────────────────────────
  async function handleDeleteOption(optionId: number, quizId: number) {
    if (!confirm('Удалить вариант ответа?')) return;
    try {
      await api.deleteOption(optionId);
      await loadQuizDetails(quizId);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <p>Загрузка...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      {/* ── Categories section ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Категории ({categories.length})</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCatCreate(v => !v)}>
            {showCatCreate ? 'Отмена' : '+ Категория'}
          </button>
        </div>

        {showCatCreate && (
          <form onSubmit={handleCreateCategory} style={{ marginBottom: 12 }}>
            <CategoryFormFields form={catForm} setForm={setCatForm} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={catSaving} style={{ marginTop: 8 }}>
              {catSaving ? '...' : 'Создать'}
            </button>
          </form>
        )}

        {categories.length === 0 ? (
          <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>Категорий нет. Создайте хотя бы одну перед добавлением тестов.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f5f5', borderRadius: 6, padding: '5px 10px', fontSize: 13 }}>
                {editingCatId === cat.id ? (
                  <form onSubmit={handleUpdateCategory} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <CategoryFormFields form={editCatForm} setForm={setEditCatForm} inline />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={catSaving}>{catSaving ? '...' : 'Ок'}</button>
                    <button type="button" className="btn btn-sm" style={{ background: '#eee', color: '#333' }} onClick={() => setEditingCatId(null)}>✕</button>
                  </form>
                ) : (
                  <>
                    <span style={{ fontWeight: 600 }}>{cat.title}</span>
                    {cat.color && <span className="badge" style={{ background: cat.color + '22', color: cat.color, fontSize: 11 }}>{cat.color}</span>}
                    <button className="btn btn-sm" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 4px' }} onClick={() => startEditCat(cat)}>✏️</button>
                    <button className="btn btn-sm" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 4px' }} onClick={() => handleDeleteCategory(cat.id)}>🗑</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Тесты ({quizzes.length})</h1>
        <button className="btn btn-primary" onClick={() => { setShowCreate(v => !v); setEditingQuizId(null); }}>
          {showCreate ? 'Отмена' : '+ Создать тест'}
        </button>
      </div>

      {/* ── Create quiz form ── */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2>Новый тест</h2>
          <form onSubmit={handleCreateQuiz}>
            <QuizFormFields form={createForm} setForm={setCreateForm} categories={categories} />
            <div style={{ marginTop: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={createSaving}>
                {createSaving ? 'Сохранение...' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      )}

      {quizzes.length === 0 && !showCreate && (
        <p className="text-muted">Тестов пока нет. Создайте первый.</p>
      )}

      {/* ── Quiz list ── */}
      {quizzes.map(quiz => {
        const isOpen = openQuizId === quiz.id;
        const isEditing = editingQuizId === quiz.id;
        const details = quizDetails[quiz.id];
        const questions = details?.questions ?? [];

        return (
          <div className="section-block" key={quiz.id}>
            {/* Quiz header */}
            <div
              className={`section-header ${isOpen ? '' : 'closed'}`}
              onClick={() => { if (!isEditing) toggleQuiz(quiz.id); }}
              style={{ cursor: isEditing ? 'default' : 'pointer' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className={`chevron ${isOpen ? 'open' : ''}`}>▶</span>
                <strong>{quiz.title}</strong>
                {quiz.topic_tag && (
                  <span className="badge" style={{ background: '#e8f4fd', color: '#2980b9' }}>{quiz.topic_tag}</span>
                )}
                <span className="badge" style={{ background: difficultyColor(quiz.difficulty) + '22', color: difficultyColor(quiz.difficulty) }}>
                  {difficultyLabel(quiz.difficulty)}
                </span>
                <span className="badge" style={{ background: '#fff3cd', color: '#856404' }}>
                  {quiz.coins_reward} монет
                </span>
                <span className="badge">{quiz.total_questions} вопр.</span>
                {!quiz.is_active && (
                  <span className="badge" style={{ background: '#f8d7da', color: '#721c24' }}>Скрыт</span>
                )}
              </span>
              <span style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-sm"
                  style={{ background: '#eee', color: '#333' }}
                  onClick={() => { startEditQuiz(quiz); setOpenQuizId(null); }}
                >
                  Редактировать
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuiz(quiz.id)}>
                  Удалить
                </button>
              </span>
            </div>

            {/* Edit quiz form (replaces body) */}
            {isEditing && (
              <div className="section-body">
                <form onSubmit={handleUpdateQuiz}>
                  <QuizFormFields form={editQuizForm} setForm={setEditQuizForm} categories={categories} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button type="submit" className="btn btn-primary" disabled={editQuizSaving}>
                      {editQuizSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button type="button" className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => setEditingQuizId(null)}>
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Quiz body: questions */}
            {isOpen && !isEditing && (
              <div className="section-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="text-muted" style={{ fontSize: 13 }}>
                    {quiz.total_questions} вопросов · {quiz.total_points} очков · {quiz.coins_reward} монет за прохождение
                    {quiz.estimated_minutes ? ` · ~${quiz.estimated_minutes} мин` : ''}
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setAddingQuestionFor(quiz.id); setQuestionForm(emptyQuestionForm()); setEditingQuestionId(null); }}
                  >
                    + Добавить вопрос
                  </button>
                </div>

                {/* Add question form */}
                {addingQuestionFor === quiz.id && (
                  <div className="card" style={{ marginBottom: 16, background: '#f9fbff' }}>
                    <h3 style={{ marginTop: 0 }}>Новый вопрос</h3>
                    <form onSubmit={e => handleCreateQuestion(e, quiz.id)}>
                      <QuestionFormFields form={questionForm} setForm={setQuestionForm} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button type="submit" className="btn btn-primary" disabled={questionSaving}>
                          {questionSaving ? '...' : 'Добавить'}
                        </button>
                        <button type="button" className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => setAddingQuestionFor(null)}>
                          Отмена
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {questions.length === 0 && <p className="text-muted">Вопросов нет. Добавьте первый.</p>}

                {/* Questions list */}
                {[...questions].sort((a, b) => a.order_index - b.order_index).map((q, idx) => {
                  const isQOpen = openQuestionId === q.id;
                  const isQEditing = editingQuestionId === q.id;

                  return (
                    <div key={q.id} style={{ border: '1px solid #e0e0e0', borderRadius: 6, marginBottom: 10, background: '#fff' }}>
                      {/* Question header */}
                      <div
                        style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: isQEditing ? 'default' : 'pointer', gap: 8 }}
                        onClick={() => { if (!isQEditing) setOpenQuestionId(isQOpen ? null : q.id); }}
                      >
                        <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
                          <span style={{ color: '#999', minWidth: 20, fontSize: 13 }}>{idx + 1}.</span>
                          <span>
                            <span style={{ fontWeight: 500 }}>{q.question_text}</span>
                            <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
                              [{QUESTION_TYPES.find(t => t.value === q.question_type)?.label}]
                            </span>
                            <span className="badge" style={{ marginLeft: 6, fontSize: 11 }}>{q.points} очк.</span>
                            {q.timer_seconds && (
                              <span className="badge" style={{ marginLeft: 4, fontSize: 11, background: '#e8f4fd', color: '#2980b9' }}>
                                {q.timer_seconds}с
                              </span>
                            )}
                            {q.question_type === 'text_input' ? (
                              <span style={{ marginLeft: 6, fontSize: 12, color: '#2980b9' }}>
                                ✎ «{q.correct_text_answer ?? '—'}»
                              </span>
                            ) : (
                              <span style={{ marginLeft: 6, fontSize: 12, color: '#aaa' }}>
                                {(q.options?.length ?? 0)} вариантов
                              </span>
                            )}
                          </span>
                        </span>
                        <span style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#eee', color: '#333' }}
                            onClick={() => { startEditQuestion(q); setOpenQuestionId(null); }}
                          >
                            Ред.
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuestion(q.id, quiz.id)}>
                            Удалить
                          </button>
                        </span>
                      </div>

                      {/* Edit question form */}
                      {isQEditing && (
                        <div style={{ padding: '0 14px 14px' }}>
                          <form onSubmit={e => handleUpdateQuestion(e, quiz.id)}>
                            <QuestionFormFields form={editQuestionForm} setForm={setEditQuestionForm} />
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <button type="submit" className="btn btn-primary" disabled={editQuestionSaving}>
                                {editQuestionSaving ? '...' : 'Сохранить'}
                              </button>
                              <button type="button" className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => setEditingQuestionId(null)}>
                                Отмена
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Options list */}
                      {isQOpen && !isQEditing && (
                        <div style={{ borderTop: '1px solid #f0f0f0', padding: '10px 14px' }}>
                          {q.explanation && (
                            <p style={{ fontSize: 12, color: '#666', margin: '0 0 10px', fontStyle: 'italic' }}>
                              Пояснение: {q.explanation}
                            </p>
                          )}
                          {q.question_type === 'text_input' && (
                            <div style={{ background: '#e8f4fd', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontSize: 13 }}>
                              <span style={{ color: '#666' }}>Эталонный ответ: </span>
                              <strong style={{ color: '#2980b9' }}>{q.correct_text_answer ?? '—'}</strong>
                              <span style={{ color: '#999', fontSize: 11, marginLeft: 8 }}>
                                (сравнение без учёта регистра)
                              </span>
                            </div>
                          )}

                          {(q.options ?? []).sort((a, b) => a.order_index - b.order_index).map(opt => (
                            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              {editingOptionId === opt.id ? (
                                <form onSubmit={e => handleUpdateOption(e, quiz.id)} style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'center' }}>
                                  <input
                                    value={editOptionForm.option_text}
                                    onChange={e => setEditOptionForm(f => ({ ...f, option_text: e.target.value }))}
                                    style={{ flex: 1, border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}
                                    required
                                  />
                                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={editOptionForm.is_correct}
                                      onChange={e => setEditOptionForm(f => ({ ...f, is_correct: e.target.checked }))}
                                    />
                                    Верный
                                  </label>
                                  <button type="submit" className="btn btn-primary btn-sm" disabled={editOptionSaving}>
                                    {editOptionSaving ? '...' : 'Ок'}
                                  </button>
                                  <button type="button" className="btn btn-sm" style={{ background: '#eee', color: '#333' }} onClick={() => setEditingOptionId(null)}>
                                    ✕
                                  </button>
                                </form>
                              ) : (
                                <>
                                  <span style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: opt.is_correct ? '#27ae60' : '#e0e0e0',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, color: opt.is_correct ? '#fff' : '#999', flexShrink: 0,
                                  }}>
                                    {opt.is_correct ? '✓' : ''}
                                  </span>
                                  <span style={{ flex: 1, fontSize: 13 }}>{opt.option_text}</span>
                                  <button className="btn btn-sm" style={{ background: '#eee', color: '#333' }} onClick={() => startEditOption(opt)}>
                                    Ред.
                                  </button>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOption(opt.id, quiz.id)}>
                                    ✕
                                  </button>
                                </>
                              )}
                            </div>
                          ))}

                          {/* Add option form — hidden for text_input */}
                          {q.question_type !== 'text_input' && addingOptionFor === q.id ? (
                            <form onSubmit={e => handleCreateOption(e, q.id, quiz.id)} style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                              <input
                                value={optionForm.option_text}
                                onChange={e => setOptionForm(f => ({ ...f, option_text: e.target.value }))}
                                placeholder="Текст варианта"
                                style={{ flex: 1, border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}
                                required
                                autoFocus
                              />
                              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <input
                                  type="checkbox"
                                  checked={optionForm.is_correct}
                                  onChange={e => setOptionForm(f => ({ ...f, is_correct: e.target.checked }))}
                                />
                                Верный
                              </label>
                              <button type="submit" className="btn btn-primary btn-sm" disabled={optionSaving}>
                                {optionSaving ? '...' : '+ Добавить'}
                              </button>
                              <button type="button" className="btn btn-sm" style={{ background: '#eee', color: '#333' }} onClick={() => setAddingOptionFor(null)}>
                                Отмена
                              </button>
                            </form>
                          ) : q.question_type !== 'text_input' ? (
                            <button
                              className="btn btn-sm"
                              style={{ marginTop: 6, background: '#f0f0f0', color: '#444' }}
                              onClick={() => { setAddingOptionFor(q.id); setOptionForm(emptyOptionForm()); setEditingOptionId(null); }}
                            >
                              + Вариант ответа
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Reusable sub-forms ────────────────────────────────────────────────────────

// categories must be in scope — passed as prop
function QuizFormFields({ form, setForm, categories }: { form: QuizForm; setForm: React.Dispatch<React.SetStateAction<QuizForm>>; categories: AdminQuizCategory[] }) {
  return (
    <div className="form-row">
      <label style={{ flex: '2 1 200px' }}>
        Название *
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
          placeholder="Цитология. Базовый уровень"
        />
      </label>
      <label style={{ flex: '1 1 160px' }}>
        Категория *
        <select
          value={form.category_id}
          onChange={e => setForm(f => ({ ...f, category_id: Number(e.target.value) }))}
          required
        >
          <option value={0} disabled>— выберите —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </label>
      <label style={{ flex: '1 1 120px' }}>
        Тема/тег
        <input
          value={form.topic_tag}
          onChange={e => setForm(f => ({ ...f, topic_tag: e.target.value }))}
          placeholder="цитология"
        />
      </label>
      <label style={{ flex: '1 1 120px' }}>
        Сложность
        <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}>
          {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </label>
      <label style={{ flex: '0 1 100px' }}>
        Монет за тест
        <input
          type="number"
          min={0}
          value={form.coins_reward}
          onChange={e => setForm(f => ({ ...f, coins_reward: Number(e.target.value) }))}
        />
      </label>
      <label style={{ flex: '0 1 80px' }}>
        Минут (~)
        <input
          type="number"
          min={1}
          value={form.estimated_minutes}
          onChange={e => setForm(f => ({ ...f, estimated_minutes: e.target.value }))}
          placeholder="5"
        />
      </label>
      <label style={{ flex: '2 1 260px' }}>
        Описание
        <input
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Краткое описание теста"
        />
      </label>
      <label style={{ flex: '0 1 80px', alignSelf: 'flex-end', paddingBottom: 6 }}>
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
          style={{ marginRight: 6 }}
        />
        Активен
      </label>
    </div>
  );
}

const COLORS = ['blue', 'green', 'red', 'orange', 'purple', 'teal', 'pink', 'yellow'];

function CategoryFormFields({
  form,
  setForm,
  inline = false,
}: {
  form: { title: string; description: string; color: string; icon: string; order_index: number };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  inline?: boolean;
}) {
  const st: React.CSSProperties = inline
    ? { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }
    : { display: 'flex', gap: 10, flexWrap: 'wrap' };

  return (
    <div style={st}>
      <input
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Название *"
        required
        style={{ flex: '1 1 140px', border: '1px solid #ddd', borderRadius: 4, padding: '5px 8px', fontSize: 13 }}
      />
      <select
        value={form.color}
        onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
        style={{ border: '1px solid #ddd', borderRadius: 4, padding: '5px 8px', fontSize: 13 }}
      >
        {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      {!inline && (
        <>
          <input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Описание"
            style={{ flex: '2 1 200px', border: '1px solid #ddd', borderRadius: 4, padding: '5px 8px', fontSize: 13 }}
          />
          <input
            type="number"
            min={0}
            value={form.order_index}
            onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))}
            placeholder="Порядок"
            style={{ width: 80, border: '1px solid #ddd', borderRadius: 4, padding: '5px 8px', fontSize: 13 }}
          />
        </>
      )}
    </div>
  );
}

function QuestionFormFields({ form, setForm }: { form: QuestionForm; setForm: React.Dispatch<React.SetStateAction<QuestionForm>> }) {
  return (
    <div className="form-row">
      <label style={{ flex: '3 1 280px' }}>
        Текст вопроса *
        <textarea
          value={form.question_text}
          onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
          required
          placeholder="Введите вопрос... (Enter — новый абзац)"
          rows={3}
          style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 'inherit' }}
        />
      </label>
      <label style={{ flex: '1 1 140px' }}>
        Тип вопроса *
        <select value={form.question_type} onChange={e => setForm(f => ({ ...f, question_type: e.target.value as QuestionType }))}>
          {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
      {form.question_type === 'text_input' && (
        <label style={{ flex: '2 1 240px' }}>
          Эталонный ответ * (ученик должен ввести это)
          <input
            value={form.correct_text_answer}
            onChange={e => setForm(f => ({ ...f, correct_text_answer: e.target.value }))}
            placeholder="Правильный ответ для автопроверки"
            required
            style={{ fontWeight: 600, borderColor: '#2980b9' }}
          />
          <span style={{ fontSize: 11, color: '#666', marginTop: 2, display: 'block' }}>
            Сравнение без учёта регистра и лишних пробелов
          </span>
        </label>
      )}
      <label style={{ flex: '0 1 70px' }}>
        Порядок
        <input
          type="number"
          min={0}
          value={form.order_index}
          onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))}
        />
      </label>
      <label style={{ flex: '0 1 80px' }}>
        Таймер (с)
        <input
          type="number"
          min={0}
          value={form.timer_seconds}
          onChange={e => setForm(f => ({ ...f, timer_seconds: e.target.value }))}
          placeholder="30"
        />
      </label>
      <label style={{ flex: '2 1 200px' }}>
        Пояснение к ответу
        <input
          value={form.explanation}
          onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
          placeholder="Объяснение правильного ответа"
        />
      </label>
      <label style={{ flex: '2 1 220px' }}>
        URL картинки
        <input
          value={form.image_url}
          onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
          placeholder="https://... (необязательно)"
        />
      </label>
      {form.image_url && (
        <div style={{ flex: '0 0 auto' }}>
          <span style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Превью</span>
          <img
            src={form.image_url}
            alt="preview"
            style={{ maxHeight: 80, maxWidth: 140, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}
