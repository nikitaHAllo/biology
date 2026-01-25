import {
  Users,
  BookOpen,
  FileQuestion,
  Coins,
  ClipboardCheck,
  TrendingUp,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const stats = [
  { label: 'Всего пользователей', value: '1,234', icon: Users, color: 'bg-blue-500' },
  { label: 'Активных за месяц', value: '856', icon: TrendingUp, color: 'bg-green-500' },
  { label: 'Курсов', value: '12', icon: BookOpen, color: 'bg-purple-500' },
  { label: 'Квизов', value: '45', icon: FileQuestion, color: 'bg-orange-500' },
  { label: 'Репкоинов в системе', value: '125,430', icon: Coins, color: 'bg-yellow-500' },
  { label: 'Заданий на проверку', value: '23', icon: ClipboardCheck, color: 'bg-red-500' },
]

const registrationData = [
  { date: '01.01', count: 12 },
  { date: '02.01', count: 19 },
  { date: '03.01', count: 15 },
  { date: '04.01', count: 25 },
  { date: '05.01', count: 22 },
  { date: '06.01', count: 30 },
  { date: '07.01', count: 28 },
]

const popularCourses = [
  { name: 'Клеточная биология', completions: 450 },
  { name: 'Генетика', completions: 380 },
  { name: 'Экология', completions: 320 },
  { name: 'Анатомия', completions: 290 },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Общая статистика платформы</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Регистрации пользователей
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0ea5e9"
                strokeWidth={2}
                name="Регистраций"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Popular Courses */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Популярные курсы
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularCourses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completions" fill="#0ea5e9" name="Завершений" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Последние действия
        </h2>
        <div className="space-y-3">
          {[
            { action: 'Новый пользователь зарегистрирован', user: '@user123', time: '5 мин назад' },
            { action: 'Квиз "Генетика" пройден', user: '@student456', time: '12 мин назад' },
            { action: 'Задание отправлено на проверку', user: '@learner789', time: '18 мин назад' },
            { action: 'Материал куплен', user: '@user321', time: '25 мин назад' },
          ].map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.user}</p>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
