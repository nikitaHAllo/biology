import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import MiniApp from './pages/MiniApp';

const App: React.FC = () => {
	return (
		<Router>
			<div className='app'>
				<Header />
				<Routes>
					<Route path='/' element={<Home />} />
					<Route path='/quiz' element={<Quiz />} />
					<Route path='/profile' element={<Profile />} />
					<Route path='/mini' element={<MiniApp />} />
				</Routes>
			</div>
		</Router>
	);
};

export default App;
