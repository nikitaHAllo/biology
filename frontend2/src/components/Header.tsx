import React from 'react';
import { NavLink } from 'react-router-dom';

const Header: React.FC = () => {
	return (
		<header style={{ background: '#2b7a78', padding: '10px 20px' }}>
			<nav>
				<ul
					style={{ display: 'flex', gap: '16px', listStyle: 'none', margin: 0 }}
				>
					<li>
						<NavLink to='/' style={{ color: 'white', textDecoration: 'none' }}>
							Личный кабинет
						</NavLink>
					</li>
					<li>
						<NavLink
							to='/quiz'
							style={{ color: 'white', textDecoration: 'none' }}
						>
							Тесты
						</NavLink>
					</li>
					<li>
						<NavLink
							to='/profile'
							style={{ color: 'white', textDecoration: 'none' }}
						>
							Профиль
						</NavLink>
					</li>
				</ul>
			</nav>
		</header>
	);
};

export default Header;
