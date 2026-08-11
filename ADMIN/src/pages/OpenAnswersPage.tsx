import { useEffect, useState } from 'react';
import { api, AdminOpenAnswer } from '../api';

const STATUS_LABELS: Record<string, string> = {
  not_requested: 'Не запрошено',
  pending: 'Ожидает проверки',
  reviewed: 'Проверено',
};

const STATUS_COLORS: Record<string, string> = {
  not_requested: '#aaa',
  pending: '#e67e22',
  reviewed: '#27ae60',
};

export default function OpenAnswersPage() {
  const [answers, setAnswers] = useState<AdminOpenAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

  // Review form state per answer id
  const [reviewing, setReviewing] = useState<Record<number, { score: string; comment: string; saving: boolean }>>({});

  async function load() {
    setLoading(true);
    try {
      const d = await api.getOpenAnswers();
      setAnswers(d.answers);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startReview(answer: AdminOpenAnswer) {
    setReviewing(s => ({
      ...s,
      [answer.id]: { score: answer.score?.toString() ?? '', comment: answer.teacher_comment ?? '', saving: false },
    }));
  }

  function cancelReview(id: number) {
    setReviewing(s => { const n = { ...s }; delete n[id]; return n; });
  }

  async function submitReview(id: number) {
    const r = reviewing[id];
    if (!r) return;
    const score = Number(r.score);
    if (isNaN(score) || score < 0) { alert('Введите корректный балл (0 и выше)'); return; }
    setReviewing(s => ({ ...s, [id]: { ...s[id], saving: true } }));
    try {
      await api.reviewOpenAnswer(id, { score, teacher_comment: r.comment || undefined });
      cancelReview(id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка сохранения');
      setReviewing(s => ({ ...s, [id]: { ...s[id], saving: false } }));
    }
  }

  const filtered = answers.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pending') return a.review_status === 'pending';
    if (filter === 'reviewed') return a.review_status === 'reviewed';
    return true;
  });

  const pendingCount = answers.filter(a => a.review_status === 'pending').length;

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>Проверка развёрнутых ответов</h1>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['pending', 'all', 'reviewed'] as const).map(f => (
          <button
            key={f}
            className={`btn${filter === f ? ' btn-primary' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'pending' ? `Ожидают проверки (${pendingCount})` : f === 'reviewed' ? 'Проверены' : 'Все'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted">
          {filter === 'pending' ? 'Нет ответов, ожидающих проверки' : 'Нет ответов'}
        </p>
      )}

      {filtered.map(answer => {
        const r = reviewing[answer.id];
        const userName = answer.user?.username || answer.user?.email || `tg:${answer.user?.telegram_id}` || `#${answer.user_id}`;
        const questionText = answer.question?.question_text ?? `Вопрос #${answer.question_id}`;
        return (
          <div className="card" key={answer.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span className="badge" style={{ background: STATUS_COLORS[answer.review_status], color: '#fff', marginRight: 8 }}>
                  {STATUS_LABELS[answer.review_status]}
                </span>
                <strong>{userName}</strong>
                <span className="text-muted" style={{ marginLeft: 8, fontSize: 12 }}>
                  {new Date(answer.submitted_at).toLocaleString('ru-RU')}
                </span>
                {answer.repcoins_spent > 0 && (
                  <span className="badge" style={{ marginLeft: 8 }}>💰 {answer.repcoins_spent} монет потрачено</span>
                )}
              </div>
              {answer.review_status !== 'not_requested' && !r && (
                <button className="btn btn-sm btn-primary" onClick={() => startReview(answer)}>
                  {answer.review_status === 'reviewed' ? '✏️ Изменить оценку' : '✅ Проверить'}
                </button>
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Вопрос (тест #{answer.quiz_id}):</div>
              <div style={{ background: '#f5f5f5', padding: '6px 10px', borderRadius: 4, fontSize: 13, whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                {questionText}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Ответ учащегося:</div>
              <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '8px 12px', borderRadius: 4, whiteSpace: 'pre-wrap', fontSize: 14 }}>
                {answer.answer_text}
              </div>
            </div>

            {answer.review_status === 'reviewed' && !r && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4 }}>
                <strong>Балл: {answer.score}</strong>
                {answer.teacher_comment && <p style={{ margin: '4px 0 0', fontSize: 13 }}>{answer.teacher_comment}</p>}
                {answer.reviewed_at && (
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                    Проверено: {new Date(answer.reviewed_at).toLocaleString('ru-RU')}
                  </div>
                )}
              </div>
            )}

            {r && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#f9fbff', border: '1px solid #d0e4ff', borderRadius: 4 }}>
                <div className="form-row" style={{ flexWrap: 'wrap' }}>
                  <label style={{ flex: '0 1 100px' }}>
                    Балл *
                    <input
                      type="number"
                      min={0}
                      value={r.score}
                      onChange={e => setReviewing(s => ({ ...s, [answer.id]: { ...s[answer.id], score: e.target.value } }))}
                      placeholder="0"
                    />
                  </label>
                  <label style={{ flex: '1 1 300px' }}>
                    Комментарий преподавателя
                    <textarea
                      value={r.comment}
                      onChange={e => setReviewing(s => ({ ...s, [answer.id]: { ...s[answer.id], comment: e.target.value } }))}
                      placeholder="Разбор ответа, указание на ошибки..."
                      rows={3}
                      style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 'inherit' }}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary" disabled={r.saving} onClick={() => submitReview(answer.id)}>
                    {r.saving ? '...' : 'Сохранить оценку'}
                  </button>
                  <button className="btn" onClick={() => cancelReview(answer.id)}>Отмена</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
