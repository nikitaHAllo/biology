import React from 'react';

const Header: React.FC = () => {
	return (
		<header>
			<nav>
				<ul>
					<li>
						<a href='/'>Главная</a>
					</li>
					<li>
						<a href='/quiz'>Тесты</a>
					</li>
					<li>
						<a href='/profile'>Профиль</a>
					</li>
				</ul>
			</nav>
		</header>
	);
};

export default Header;
