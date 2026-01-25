import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface AuthUser {
  username: string
  role: 'super_admin' | 'admin' | 'moderator'
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Проверяем локальное хранилище
    const storedUser = localStorage.getItem('admin_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (username: string, password: string) => {
    // Простая проверка - любой пароль подойдет для демо
    if (username && password) {
      const authUser: AuthUser = {
        username,
        role: username === 'admin' ? 'super_admin' : 'admin',
      }
      localStorage.setItem('admin_user', JSON.stringify(authUser))
      setUser(authUser)
      navigate('/')
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem('admin_user')
    setUser(null)
    navigate('/login')
  }

  return {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  }
}
