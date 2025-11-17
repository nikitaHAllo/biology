import { Router } from 'express';
import { usersRouter } from './users.routes';
// Импорты других роутеров будут добавлены позже
// import { coursesRouter } from './courses.routes';
// import { lessonsRouter } from './lessons.routes';

const router = Router();

// Маршруты API
router.use('/users', usersRouter);
// router.use('/courses', coursesRouter);
// router.use('/lessons', lessonsRouter);

export { router as apiRouter };
