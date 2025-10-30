import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { usersRouter } from './routes/users';
import { query } from '../db/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => {
	res.json({ status: 'OK' });
});

// DB readiness check
app.get('/api/health/db', async (req, res) => {
	try {
		await query('SELECT 1');
		res.json({ db: 'ok' });
	} catch (err) {
		console.error('DB health check failed', err);
		res.status(503).json({ db: 'down', error: String(err) });
	}
});

// Error handling middleware
app.use(
	(
		err: Error,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.error(err.stack);
		res.status(500).json({ error: 'Something broke!' });
	}
);

export { app };
