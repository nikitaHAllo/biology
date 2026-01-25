import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Eye, Clock, CheckCircle, XCircle } from 'lucide-react'
import { AssignmentSubmission } from '@/lib/types'

// Mock data
const mockSubmissions: AssignmentSubmission[] = [
  {
    id: 1,
    assignment_id: 1,
    assignment_title: 'Задание по генетике',
    user_id: 1,
    user_telegram_id: '123456789',
    user_username: 'user1',
    file_url: '/files/submission1.pdf',
    status: 'pending',
    submitted_at: '2024-01-20 10:30',
  },
  {
    id: 2,
    assignment_id: 2,
    assignment_title: 'Лабораторная работа',
    user_id: 2,
    user_telegram_id: '987654321',
    user_username: 'student2',
    file_url: '/files/submission2.pdf',
    status: 'reviewing',
    submitted_at: '2024-01-19 15:20',
  },
  {
    id: 3,
    assignment_id: 1,
    assignment_title: 'Задание по генетике',
    user_id: 3,
    user_telegram_id: '555666777',
    user_username: 'learner3',
    file_url: '/files/submission3.pdf',
    status: 'graded',
    score: 85,
    submitted_at: '2024-01-18 09:15',
  },
]

const statusConfig = {
  pending: { label: 'Ожидает', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: 'На проверке', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  graded: { label: 'Проверено', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Отклонено', icon: XCircle, color: 'bg-red-100 text-red-700' },
}

export default function AssignmentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [submissions] = useState<AssignmentSubmission[]>(mockSubmissions)

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.user_username?.toLowerCase().includes(search.toLowerCase()) ||
      submission.assignment_title?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Задания на проверку</h1>
          <p className="text-gray-600 mt-2">Управление отправками заданий</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Создать задание
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск по пользователю или заданию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-48"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="reviewing">На проверке</option>
            <option value="graded">Проверено</option>
            <option value="rejected">Отклонено</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Пользователь</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Задание</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Статус</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Оценка</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Дата отправки</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => {
                const status = statusConfig[submission.status]
                const StatusIcon = status.icon
                return (
                  <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{submission.id}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">@{submission.user_username}</p>
                        <p className="text-sm text-gray-500">{submission.user_telegram_id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{submission.assignment_title}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon size={14} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {submission.score !== undefined ? (
                        <span className="font-semibold text-gray-900">{submission.score}/100</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{submission.submitted_at}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/assignments/submissions/${submission.id}`}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                          title="Проверить"
                        >
                          <Eye size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
