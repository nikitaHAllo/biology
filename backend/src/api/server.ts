import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { usersRouter } from './routes/users';
import { coursesRouter } from './routes/courses';
import { lessonsRouter } from './routes/lessons';
import { tasksRouter } from './routes/tasks';
import { progressRouter } from './routes/progress';
import { assignmentsRouter } from './routes/assignments';
import { adminRouter } from './routes/admin';
import { query } from '../db/index';
import { errorHandler } from './middleware/error';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', usersRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/progress', progressRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/admin', adminRouter);

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
app.use(errorHandler);

export { app };
