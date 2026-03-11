// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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

const App: React.FC = () => {
	return (
		<Router>
			<div className='app'>
				<Header />

				<Routes>
					{/* Основные страницы */}
					<Route path='/' element={<Home />} />
					<Route path='/quiz' element={<QuizPage />} />
					<Route path='/profile' element={<Profile />} />

					{/* Страница со всеми модулями фф*/}
					<Route path='/mini' element={<ModulesPage />} />

					{/* Игровые маршруты */}
					<Route path='/biogarden' element={<BioGardenGame />} />
					<Route path='/genetics' element={<GeneticCalculator />} />
					<Route path='/virus' element={<VirusDetectiveGame />} />
				</Routes>
			</div>
		</Router>
	);
};

export default App;
