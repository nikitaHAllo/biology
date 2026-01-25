import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, Save } from 'lucide-react'
import { useState } from 'react'

// Mock data
const mockQuiz = {
  id: 1,
  title: 'Квиз по генетике',
  description: 'Проверка знаний по основам генетики',
  total_questions: 20,
  total_points: 100,
  estimated_minutes: 30,
  is_active: true,
  created_at: '2024-01-15',
}

const mockQuestions = [
  {
    id: 1,
    question_text: 'Что такое ДНК?',
    type: 'single_choice',
    order_index: 1,
    points: 5,
    explanation: 'ДНК - это дезоксирибонуклеиновая кислота',
  },
  {
    id: 2,
    question_text: 'Выберите правильные утверждения о генах',
    type: 'multiple_choice',
    order_index: 2,
    points: 10,
  },
]

export default function QuizDetailPage() {
  useParams() // Get id from URL if needed in future
  const [quiz, setQuiz] = useState(mockQuiz)
  const [questions] = useState(mockQuestions)

  return (
    <div className="space-y-6">
      <Link
        to="/quizzes"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        Назад к списку
      </Link>

      {/* Quiz Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Редактирование квиза</h1>
          <button className="btn btn-primary flex items-center gap-2">
            <Save size={20} />
            Сохранить
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название квиза
            </label>
            <input
              type="text"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Оценка времени (минуты)
            </label>
            <input
              type="number"
              value={quiz.estimated_minutes}
              onChange={(e) =>
                setQuiz({ ...quiz, estimated_minutes: parseInt(e.target.value) })
              }
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={quiz.description}
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Всего вопросов
            </label>
            <input type="text" value={quiz.total_questions} className="input" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Всего баллов
            </label>
            <input type="text" value={quiz.total_points} className="input" readOnly />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={quiz.is_active}
                onChange={(e) => setQuiz({ ...quiz, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Активен</span>
            </label>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Вопросы квиза</h2>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={20} />
            Добавить вопрос
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((question, idx) => (
            <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    Вопрос {idx + 1}
                  </span>
                  <span className="text-sm text-gray-500">
                    {question.type === 'single_choice'
                      ? 'Одиночный выбор'
                      : question.type === 'multiple_choice'
                      ? 'Множественный выбор'
                      : 'Верно/Неверно'}
                  </span>
                  <span className="text-sm text-gray-500">{question.points} баллов</span>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                    <Edit size={18} />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="text-gray-900 mb-2">{question.question_text}</p>
              {question.explanation && (
                <p className="text-sm text-gray-500 italic">{question.explanation}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
