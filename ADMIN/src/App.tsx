import { useState, useEffect } from 'react';
import { auth } from './auth';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import ContentPage from './pages/ContentPage';
import TasksPage from './pages/TasksPage';
import QuizzesPage from './pages/QuizzesPage';
import GeneticsPage from './pages/GeneticsPage';
import VirusPage from './pages/VirusPage';
import BioGardenPage from './pages/BioGardenPage';
import OpenAnswersPage from './pages/OpenAnswersPage';

type Page = 'users' | 'content' | 'tasks' | 'quizzes' | 'genetics' | 'virus' | 'biogarden' | 'open-answers';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(auth.isLoggedIn());
  const [page, setPage] = useState<Page>('users');

  useEffect(() => {
    setLoggedIn(auth.isLoggedIn());
  }, []);

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  function logout() {
    auth.clear();
    setLoggedIn(false);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-title">БиоЛаб Админ</div>
        <nav>
          <button
            className={page === 'users' ? 'active' : ''}
            onClick={() => setPage('users')}
          >
            👥 Пользователи
          </button>
          <button
            className={page === 'content' ? 'active' : ''}
            onClick={() => setPage('content')}
          >
            📚 Контент
          </button>
          <button
            className={page === 'tasks' ? 'active' : ''}
            onClick={() => setPage('tasks')}
          >
            📋 Задания
          </button>
          <button
            className={page === 'quizzes' ? 'active' : ''}
            onClick={() => setPage('quizzes')}
          >
            🧪 Тесты
          </button>
          <button
            className={page === 'genetics' ? 'active' : ''}
            onClick={() => setPage('genetics')}
          >
            🧬 Генетика
          </button>
          <button
            className={page === 'virus' ? 'active' : ''}
            onClick={() => setPage('virus')}
          >
            🦠 Вирусный детектив
          </button>
          <button
            className={page === 'biogarden' ? 'active' : ''}
            onClick={() => setPage('biogarden')}
          >
            🌱 Биосадовник
          </button>
          <button
            className={page === 'open-answers' ? 'active' : ''}
            onClick={() => setPage('open-answers')}
          >
            📝 Проверка ответов
          </button>
        </nav>
        <div className="sidebar-footer">
          <button onClick={logout}>Выйти</button>
        </div>
      </aside>

      <main className="main">
        {page === 'users' && <UsersPage />}
        {page === 'content' && <ContentPage />}
        {page === 'tasks' && <TasksPage />}
        {page === 'quizzes' && <QuizzesPage />}
        {page === 'genetics' && <GeneticsPage />}
        {page === 'virus' && <VirusPage />}
        {page === 'biogarden' && <BioGardenPage />}
        {page === 'open-answers' && <OpenAnswersPage />}
      </main>
    </div>
  );
}
