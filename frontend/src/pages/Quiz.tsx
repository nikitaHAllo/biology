import React, { useState } from 'react';

const Quiz: React.FC = () => {
	const [currentQuestion] = useState(0);

	return (
		<div className='quiz'>
			<h1>Тестирование</h1>
			<div className='quiz-content'>Вопрос #{currentQuestion + 1}</div>
		</div>
	);
};

export default Quiz;
	