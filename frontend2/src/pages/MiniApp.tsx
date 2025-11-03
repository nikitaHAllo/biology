import React, { useState } from 'react';
// import { api } from '../api';

const MiniApp: React.FC = () => {
	const [telegramId, setTelegramId] = useState('');
	const [username, setUsername] = useState('');
	// const [result, setResult] = useState(null);

	// const register = async () => {
	// 	try {
	// 		const res = await api.registerUser({ telegram_id: telegramId, username });
	// 		setResult(res.data);
	// 	} catch {
	// 		setResult('Ошибка при регистрации пользователя');
	// 	}
	// };

	return (
		<div style={{ padding: 20 }}>
			<h2>Mini App — регистрация пользователя</h2>
			<div style={{ marginBottom: 8 }}>
				<input
					placeholder='telegram_id'
					value={telegramId}
					onChange={e => setTelegramId(e.target.value)}
				/>
			</div>
			<div style={{ marginBottom: 8 }}>
				<input
					placeholder='username'
					value={username}
					onChange={e => setUsername(e.target.value)}
				/>
			</div>
			{/* <button onClick={register}>Зарегистрироваться / Обновить</button> */}

			{/* {result && (
				<pre style={{ marginTop: 12, background: '#f5f5f5', padding: 8 }}>
					{JSON.stringify(result, null, 2)}
				</pre>
			)} */}
		</div>
	);
};

export default MiniApp;
