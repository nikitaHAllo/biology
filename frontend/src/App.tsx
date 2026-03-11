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

// Маршруты, где Header скрыт (игры на весь экран)
const FULLSCREEN_ROUTES = ['/biogarden', '/genetics', '/virus'];

const AppLayout: React.FC = () => {
	const location = useLocation();
	const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname);

	return (
		<div className='app' style={isFullscreen ? { height: '100dvh', overflow: 'hidden' } : undefined}>
			{!isFullscreen && <Header />}

			<Routes>
				{/* Основные страницы */}
				<Route path='/' element={<Home />} />
				<Route path='/quiz' element={<QuizPage />} />
				<Route path='/profile' element={<Profile />} />

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
