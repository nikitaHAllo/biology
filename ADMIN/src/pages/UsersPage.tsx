import { useEffect, useState } from 'react';
import { api, AdminUser, AdminUserStats } from '../api';

function fmt(date: string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatsBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: color, borderRadius: 8, padding: '6px 14px', minWidth: 70 }}>
      <strong style={{ fontSize: 20 }}>{value}</strong>
      <span style={{ fontSize: 11, opacity: 0.8 }}>{label}</span>
    </span>
  );
}

function UserStatsPanel({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getUserStats(userId)
      .then(d => setStats(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const u = stats?.user;
  const quizPassed = stats?.quiz_results.filter(r => r.is_passed).length ?? 0;
  const plantsCompleted = stats?.garden_progress.filter(p => p.is_completed).length ?? 0;
  const geneticsCompleted = stats?.genetic_results.filter(r => r.is_completed).length ?? 0;
  const virusCompleted = stats?.virus_results.filter(r => r.is_completed).length ?? 0;

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 700, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', zIndex: 1000, overflowY: 'auto', padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Детальная статистика</h2>
        <button className="btn" onClick={onClose} style={{ fontSize: 18, padding: '2px 12px' }}>✕</button>
      </div>

      {loading && <p>Загрузка...</p>}
      {error && <p className="error">{error}</p>}

      {stats && (
        <>
          {/* User info */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>Пользователь</div>
                <strong>{u?.username ?? u?.email ?? `ID ${u?.id}`}</strong>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>Email</div>
                <span>{u?.email ?? '—'}</span>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>Telegram ID</div>
                <span>{u?.telegram_id ?? '—'}</span>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>Монеты</div>
                <strong>{u?.coins} 🪙</strong>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>Зарегистрирован</div>
                <span>{fmt(u?.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Summary badges */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatsBadge value={quizPassed} label="тестов сдано" color="#e8f5e9" />
            <StatsBadge value={stats.quiz_results.length} label="попыток" color="#f3f3f3" />
            <StatsBadge value={plantsCompleted} label="растений вырастил" color="#e8f5e9" />
            <StatsBadge value={stats.garden_progress.length} label="посажено" color="#f3f3f3" />
            <StatsBadge value={geneticsCompleted} label="генетик решено" color="#e8f5e9" />
            <StatsBadge value={virusCompleted} label="вирусов найдено" color="#e8f5e9" />
          </div>

          {/* Quiz results */}
          <h3>Тесты ({stats.quiz_results.length})</h3>
          {stats.quiz_results.length === 0
            ? <p className="text-muted">Нет попыток</p>
            : (
              <table style={{ marginBottom: 24 }}>
                <thead>
                  <tr>
                    <th>Тест</th>
                    <th>Счёт</th>
                    <th>Результат</th>
                    <th>Монеты</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.quiz_results.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.quiz_title}</strong></td>
                      <td>{r.score} / {r.total_questions}</td>
                      <td>
                        <span className="badge" style={{ background: r.is_passed ? '#e8f5e9' : '#fce8e6', color: r.is_passed ? '#2d7d32' : '#c62828' }}>
                          {r.is_passed ? '✓ Сдан' : '✗ Не сдан'}
                        </span>
                      </td>
                      <td>{r.earned_coins > 0 ? `+${r.earned_coins} 🪙` : '—'}</td>
                      <td className="text-muted">{fmt(r.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }

          {/* BioGarden */}
          <h3>Биосад ({stats.garden_progress.length} растений)</h3>
          {stats.garden_progress.length === 0
            ? <p className="text-muted">Нет растений</p>
            : (
              <table style={{ marginBottom: 24 }}>
                <thead>
                  <tr>
                    <th>Растение</th>
                    <th>Стадия</th>
                    <th>Опыт</th>
                    <th>Статус</th>
                    <th>Посажено</th>
                    <th>Завершено</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.garden_progress.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.plant_name}</strong></td>
                      <td>{p.current_stage}</td>
                      <td>{p.experience_points} XP</td>
                      <td>
                        <span className="badge" style={{
                          background: p.is_completed ? '#e8f5e9' : p.is_wilted ? '#fce8e6' : '#fff3cd',
                          color: p.is_completed ? '#2d7d32' : p.is_wilted ? '#c62828' : '#856404',
                        }}>
                          {p.is_completed ? '✓ Вырос' : p.is_wilted ? '✗ Завял' : '⏳ Растёт'}
                        </span>
                      </td>
                      <td className="text-muted">{fmt(p.planted_at)}</td>
                      <td className="text-muted">{fmt(p.completed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }

          {/* Genetics */}
          <h3>Генетический калькулятор ({stats.genetic_results.length})</h3>
          {stats.genetic_results.length === 0
            ? <p className="text-muted">Нет попыток</p>
            : (
              <table style={{ marginBottom: 24 }}>
                <thead>
                  <tr>
                    <th>Сценарий</th>
                    <th>Счёт</th>
                    <th>Монеты</th>
                    <th>Статус</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.genetic_results.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.scenario_title}</strong></td>
                      <td>{r.score}</td>
                      <td>{r.coins_earned > 0 ? `+${r.coins_earned} 🪙` : '—'}</td>
                      <td>
                        <span className="badge" style={{ background: r.is_completed ? '#e8f5e9' : '#f3f3f3', color: r.is_completed ? '#2d7d32' : '#555' }}>
                          {r.is_completed ? '✓ Завершён' : 'В процессе'}
                        </span>
                      </td>
                      <td className="text-muted">{fmt(r.completed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }

          {/* Virus */}
          <h3>Детектив-вирусолог ({stats.virus_results.length})</h3>
          {stats.virus_results.length === 0
            ? <p className="text-muted">Нет попыток</p>
            : (
              <table style={{ marginBottom: 24 }}>
                <thead>
                  <tr>
                    <th>Дело</th>
                    <th>Счёт</th>
                    <th>Улик использовано</th>
                    <th>Монеты</th>
                    <th>Статус</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.virus_results.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.case_title}</strong></td>
                      <td>{r.score}</td>
                      <td>{r.clues_used}</td>
                      <td>{r.coins_earned > 0 ? `+${r.coins_earned} 🪙` : '—'}</td>
                      <td>
                        <span className="badge" style={{ background: r.is_completed ? '#e8f5e9' : '#f3f3f3', color: r.is_completed ? '#2d7d32' : '#555' }}>
                          {r.is_completed ? '✓ Раскрыто' : 'В процессе'}
                        </span>
                      </td>
                      <td className="text-muted">{fmt(r.completed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </>
      )}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    api.getUsers()
      .then(d => setUsers(d.users))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>Пользователи ({users.length})</h1>
      <p className="text-muted" style={{ marginBottom: 12, fontSize: 13 }}>Нажмите на строку для просмотра детальной статистики</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Имя</th>
            <th>Telegram ID</th>
            <th>Монеты</th>
            <th>Зарегистрирован</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>Нет пользователей</td></tr>
          )}
          {users.map(u => (
            <tr
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              style={{ cursor: 'pointer', background: selectedUserId === u.id ? '#f0f7ff' : undefined }}
            >
              <td>{u.id}</td>
              <td>{u.email ?? <span className="text-muted">—</span>}</td>
              <td>{u.username ?? <span className="text-muted">—</span>}</td>
              <td>{u.telegram_id ?? <span className="text-muted">—</span>}</td>
              <td>{u.coins}</td>
              <td className="text-muted">{new Date(u.created_at).toLocaleString('ru')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUserId !== null && (
        <>
          <div
            onClick={() => setSelectedUserId(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }}
          />
          <UserStatsPanel userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        </>
      )}
    </div>
  );
}
