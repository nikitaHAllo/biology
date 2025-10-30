import React, { useState } from 'react';

const Quiz: React.FC = () => {
	const [currentQuestion, setCurrentQuestion] = useState(0);

	return (
		<div className='quiz'>
			<h1>Тестирование</h1>
			<div className='quiz-content'>{/* Здесь будет контент теста */}</div>
		</div>
	);
};

export default Quiz;
