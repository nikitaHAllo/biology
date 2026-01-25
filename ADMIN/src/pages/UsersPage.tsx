import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Edit, Eye } from 'lucide-react'
import { User } from '@/lib/types'

// Mock data
const mockUsers: User[] = [
  {
    id: 1,
    telegram_id: '123456789',
    username: 'user1',
    repcoins_balance: 1500,
    created_at: '2024-01-15',
    lessons_completed: 12,
    achievements_count: 5,
  },
  {
    id: 2,
    telegram_id: '987654321',
    username: 'student2',
    repcoins_balance: 2300,
    created_at: '2024-01-10',
    lessons_completed: 25,
    achievements_count: 8,
  },
  {
    id: 3,
    telegram_id: '555666777',
    username: 'learner3',
    repcoins_balance: 800,
    created_at: '2024-01-20',
    lessons_completed: 5,
    achievements_count: 2,
  },
]

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [users] = useState<User[]>(mockUsers)

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.telegram_id.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Пользователи</h1>
          <p className="text-gray-600 mt-2">Управление пользователями платформы</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Добавить пользователя
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск по username или Telegram ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select className="input w-48">
            <option>Все пользователи</option>
            <option>С балансом &gt; 1000</option>
            <option>Активные</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Telegram ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Баланс</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Уроков</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Достижений</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Дата регистрации</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{user.id}</td>
                  <td className="py-3 px-4 font-mono text-sm">{user.telegram_id}</td>
                  <td className="py-3 px-4">@{user.username || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-yellow-600">{user.repcoins_balance}</span>
                  </td>
                  <td className="py-3 px-4">{user.lessons_completed || 0}</td>
                  <td className="py-3 px-4">{user.achievements_count || 0}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{user.created_at}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/users/${user.id}`}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                        title="Просмотр"
                      >
                        <Eye size={18} />
                      </Link>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="Редактировать"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">Показано 1-3 из 3</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
              Назад
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
              Вперед
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
