import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { TelegramProvider } from './providers/TelegramProvider';
import { TelegramThemeApp } from './components/TelegramThemeApp';
import App from './App';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const adaptiveTheme = createTheme({
	primaryColor: 'teal',
});

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);

root.render(
	<React.StrictMode>
		<TelegramProvider>
			<TelegramThemeApp>
				{colorScheme => (
					<MantineProvider
						theme={adaptiveTheme}
						defaultColorScheme={colorScheme}
						forceColorScheme={colorScheme}
					>
						<Notifications />
						<App />
					</MantineProvider>
				)}
			</TelegramThemeApp>
		</TelegramProvider>
	</React.StrictMode>
);
