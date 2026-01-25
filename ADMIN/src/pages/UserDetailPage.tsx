import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Coins, BookOpen, Award } from 'lucide-react'
import { useState } from 'react'

// Mock data
const mockUser = {
  id: 1,
  telegram_id: '123456789',
  username: 'user1',
  repcoins_balance: 1500,
  created_at: '2024-01-15',
  lessons_completed: 12,
  achievements_count: 5,
}

const mockProgress = [
  { lesson_id: 1, lesson_title: 'Введение в биологию', status: 'completed', completed_at: '2024-01-16' },
  { lesson_id: 2, lesson_title: 'Клеточная структура', status: 'completed', completed_at: '2024-01-17' },
  { lesson_id: 3, lesson_title: 'Генетика', status: 'in_progress' },
]

const mockTransactions = [
  { id: 1, type: 'credit', amount: 100, source: 'quiz_completion', created_at: '2024-01-20' },
  { id: 2, type: 'debit', amount: -50, source: 'material_purchase', created_at: '2024-01-19' },
  { id: 3, type: 'credit', amount: 200, source: 'assignment_reward', created_at: '2024-01-18' },
]

export default function UserDetailPage() {
  useParams() // Get id from URL if needed in future
  const [user] = useState(mockUser)
  const [activeTab, setActiveTab] = useState<'info' | 'progress' | 'transactions'>('info')

  return (
    <div className="space-y-6">
      <Link
        to="/users"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        Назад к списку
      </Link>

      {/* User Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">@{user.username}</h1>
            <p className="text-gray-600 mt-1">Telegram ID: {user.telegram_id}</p>
            <p className="text-sm text-gray-500 mt-1">Зарегистрирован: {user.created_at}</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <Edit size={20} />
            Редактировать
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Coins size={20} />
              <span className="font-semibold">Баланс</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{user.repcoins_balance}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <BookOpen size={20} />
              <span className="font-semibold">Уроков</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{user.lessons_completed}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Award size={20} />
              <span className="font-semibold">Достижений</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{user.achievements_count}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            {[
              { id: 'info', label: 'Информация' },
              { id: 'progress', label: 'Прогресс' },
              { id: 'transactions', label: 'Транзакции' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'info' | 'progress' | 'transactions')}
                className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Основная информация</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Telegram ID</label>
                  <input type="text" value={user.telegram_id} className="input" readOnly />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Username</label>
                  <input type="text" value={user.username} className="input" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Баланс репкоинов</label>
                  <input type="number" value={user.repcoins_balance} className="input" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Дата регистрации</label>
                  <input type="text" value={user.created_at} className="input" readOnly />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-4">
            {mockProgress.map((progress) => (
              <div
                key={progress.lesson_id}
                className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{progress.lesson_title}</p>
                  <p className="text-sm text-gray-500">
                    Статус: {progress.status === 'completed' ? 'Завершен' : 'В процессе'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {progress.status === 'completed' ? 'Завершен' : 'В процессе'}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-3">
            {mockTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{transaction.source}</p>
                  <p className="text-sm text-gray-500">{transaction.created_at}</p>
                </div>
                <span
                  className={`font-semibold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'credit' ? '+' : ''}
                  {transaction.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
