// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Компоненты сайта
import Header from './components/Header';
import Home from './pages/Home';
import QuizPage from './pages/Quiz';
import Profile from './pages/Profile';

// Игровые модули
import ModulesPage, {
	GeneticCalculator,
	VirusDetectiveGame,
} from './pages/MiniApp';
import { BioGardenGame } from './components/game/BioGardenGame';
import Login from './pages/Login';
import Register from './pages/Register';
import { RootRedirect } from './components/RootRedirect';

// Маршруты, где Header скрыт
const HEADER_HIDDEN_ROUTES = ['/biogarden', '/genetics', '/virus', '/login', '/register'];
// Маршруты с заблокированным overflow (сложные game-UI со своим скроллом)
const OVERFLOW_LOCKED_ROUTES = ['/biogarden', '/genetics'];

const AppLayout: React.FC = () => {
	const location = useLocation();
	const hideHeader = HEADER_HIDDEN_ROUTES.includes(location.pathname);
	const overflowLocked = OVERFLOW_LOCKED_ROUTES.includes(location.pathname);

	return (
		<div className='app' style={hideHeader ? { height: '100dvh', overflow: overflowLocked ? 'hidden' : 'auto' } : undefined}>
			{!hideHeader && <Header />}

			<Routes>
				{/* Основные страницы */}
				<Route path='/' element={<RootRedirect />} />
				<Route path='/home' element={<Home />} />
				<Route path='/quiz' element={<QuizPage />} />
				<Route path='/profile' element={<Profile />} />
				<Route path='/login' element={<Login />} />
				<Route path='/register' element={<Register />} />

				{/* Страница со всеми модулями */}
				<Route path='/mini' element={<ModulesPage />} />

				{/* Игровые маршруты — без Header, на весь экран */}
				<Route path='/biogarden' element={<BioGardenGame />} />
				<Route path='/genetics' element={<GeneticCalculator />} />
				<Route path='/virus' element={<VirusDetectiveGame />} />
			</Routes>
		</div>
	);
};

const App: React.FC = () => {
	return (
		<Router>
			<AppLayout />
		</Router>
	);
};

export default App;
