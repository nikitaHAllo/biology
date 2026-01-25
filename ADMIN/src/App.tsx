import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import QuizzesPage from './pages/QuizzesPage'
import QuizDetailPage from './pages/QuizDetailPage'
import AssignmentsPage from './pages/AssignmentsPage'
import AssignmentSubmissionPage from './pages/AssignmentSubmissionPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="quizzes/:id" element={<QuizDetailPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="assignments/submissions/:id" element={<AssignmentSubmissionPage />} />
      </Route>
    </Routes>
  )
}

export default App
