import { useEffect, useState } from 'react';
import { api, AdminUser } from '../api';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            <tr key={u.id}>
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
    </div>
  );
}
