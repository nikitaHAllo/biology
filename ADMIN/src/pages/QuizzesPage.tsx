import { useState } from 'react'
import { Search, Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import { Quiz } from '@/lib/types'

// Mock data
const mockQuizzes: Quiz[] = [
  {
    id: 1,
    title: 'Квиз по генетике',
    description: 'Проверка знаний по основам генетики',
    total_questions: 20,
    total_points: 100,
    estimated_minutes: 30,
    is_active: true,
    created_at: '2024-01-15',
  },
  {
    id: 2,
    title: 'Клеточная биология',
    description: 'Тест по строению клетки',
    total_questions: 15,
    total_points: 75,
    estimated_minutes: 20,
    is_active: false,
    created_at: '2024-01-10',
  },
  {
    id: 3,
    title: 'Экология и окружающая среда',
    description: 'Проверка знаний по экологии',
    total_questions: 25,
    total_points: 125,
    estimated_minutes: 40,
    is_active: true,
    created_at: '2024-01-20',
  },
]

export default function QuizzesPage() {
  const [search, setSearch] = useState('')
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes)

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(search.toLowerCase())
  )

  const toggleActive = (id: number) => {
    setQuizzes(
      quizzes.map((quiz) =>
        quiz.id === id ? { ...quiz, is_active: !quiz.is_active } : quiz
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Квизы</h1>
          <p className="text-gray-600 mt-2">Управление квизами платформы</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Создать квиз
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select className="input w-48">
            <option>Все квизы</option>
            <option>Активные</option>
            <option>Неактивные</option>
          </select>
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Название</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Вопросов</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Баллов</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Время</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Статус</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Дата создания</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuizzes.map((quiz) => (
                <tr key={quiz.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{quiz.id}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{quiz.title}</p>
                      <p className="text-sm text-gray-500">{quiz.description}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">{quiz.total_questions}</td>
                  <td className="py-3 px-4">{quiz.total_points}</td>
                  <td className="py-3 px-4">{quiz.estimated_minutes} мин</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleActive(quiz.id)}
                      className="flex items-center gap-2"
                    >
                      {quiz.is_active ? (
                        <>
                          <ToggleRight className="text-green-600" size={20} />
                          <span className="text-sm text-green-600">Активен</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="text-gray-400" size={20} />
                          <span className="text-sm text-gray-400">Неактивен</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{quiz.created_at}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                        title="Просмотр"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="Редактировать"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
