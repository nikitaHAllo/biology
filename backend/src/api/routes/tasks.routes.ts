import { Router } from 'express';
import { tasksController } from '../controllers/tasks.controller';

const router = Router();

router.get('/downloads', (req, res) => tasksController.listDownloads(req, res));

export { router as tasksRouter };


