import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Save, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'

// Mock data
const mockSubmission = {
  id: 1,
  assignment_id: 1,
  assignment_title: 'Задание по генетике',
  user_id: 1,
  user_telegram_id: '123456789',
  user_username: 'user1',
  file_url: '/files/submission1.pdf',
  status: 'pending',
  submitted_at: '2024-01-20 10:30',
}

const mockAssignment = {
  id: 1,
  title: 'Задание по генетике',
  requirements: `
    Выполните следующие задания:
    1. Опишите структуру ДНК
    2. Объясните процесс репликации
    3. Приведите примеры мутаций
  `,
}

export default function AssignmentSubmissionPage() {
  useParams() // Get id from URL if needed in future
  const [submission] = useState(mockSubmission)
  const [score, setScore] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [checklist, setChecklist] = useState({
    structure: false,
    replication: false,
    mutations: false,
  })

  return (
    <div className="space-y-6">
      <Link
        to="/assignments"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        Назад к списку
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Review Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Info */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о задании</h2>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{mockAssignment.title}</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {mockAssignment.requirements}
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о пользователе</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Telegram ID</label>
                <p className="font-mono text-sm">{submission.user_telegram_id}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Username</label>
                <p>@{submission.user_username}</p>
              </div>
            </div>
          </div>

          {/* Submitted File */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Отправленный файл</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">submission.pdf</p>
                <p className="text-sm text-gray-500">Размер: 2.5 MB</p>
              </div>
              <button className="btn btn-secondary flex items-center gap-2">
                <Download size={18} />
                Скачать
              </button>
            </div>
          </div>

          {/* Review Form */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Проверка задания</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Оценка (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value))}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Комментарий
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input"
                  rows={5}
                  placeholder="Оставьте комментарий к проверке..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Чеклист
                </label>
                <div className="space-y-2">
                  {Object.entries(checklist).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setChecklist({ ...checklist, [key]: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="btn btn-primary flex items-center gap-2 flex-1">
                  <CheckCircle size={18} />
                  Принять
                </button>
                <button className="btn btn-danger flex items-center gap-2 flex-1">
                  <XCircle size={18} />
                  Отклонить
                </button>
                <button className="btn btn-secondary flex items-center gap-2">
                  <Save size={18} />
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Статус</h3>
            <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              Ожидает проверки
            </span>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Информация</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Дата отправки</p>
                <p className="font-medium text-gray-900">{submission.submitted_at}</p>
              </div>
              <div>
                <p className="text-gray-600">ID отправки</p>
                <p className="font-medium text-gray-900">#{submission.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
