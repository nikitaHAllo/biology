import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.post('/login', (req, res) => adminController.login(req, res));

router.get('/users', adminAuth, (req, res) => adminController.getUsers(req, res));

router.get('/sections', adminAuth, (req, res) => adminController.getSections(req, res));
router.post('/sections', adminAuth, (req, res) => adminController.createSection(req, res));
router.delete('/sections/:id', adminAuth, (req, res) => adminController.deleteSection(req, res));

router.post('/topics', adminAuth, (req, res) => adminController.createTopic(req, res));
router.delete('/topics/:id', adminAuth, (req, res) => adminController.deleteTopic(req, res));

router.post('/files', adminAuth, (req, res) => adminController.createFile(req, res));
router.delete('/files/:id', adminAuth, (req, res) => adminController.deleteFile(req, res));

router.get('/tasks', adminAuth, (req, res) => adminController.getTasks(req, res));
router.post('/tasks', adminAuth, (req, res) => adminController.createTask(req, res));
router.delete('/tasks/:id', adminAuth, (req, res) => adminController.deleteTask(req, res));

router.get('/collections', adminAuth, (req, res) => adminController.getCollections(req, res));
router.post('/collections', adminAuth, (req, res) => adminController.createCollection(req, res));
router.delete('/collections/:id', adminAuth, (req, res) => adminController.deleteCollection(req, res));
router.post('/collections/:id/tasks', adminAuth, (req, res) => adminController.addTaskToCollection(req, res));
router.delete('/collections/:id/tasks/:taskId', adminAuth, (req, res) => adminController.removeTaskFromCollection(req, res));

// Quizzes
router.get('/quizzes', adminAuth, (req, res) => adminController.getQuizzes(req, res));
router.get('/quizzes/:id', adminAuth, (req, res) => adminController.getQuiz(req, res));
router.post('/quizzes', adminAuth, (req, res) => adminController.createQuiz(req, res));
router.put('/quizzes/:id', adminAuth, (req, res) => adminController.updateQuiz(req, res));
router.delete('/quizzes/:id', adminAuth, (req, res) => adminController.deleteQuiz(req, res));

// Questions
router.post('/quizzes/:quizId/questions', adminAuth, (req, res) => adminController.createQuestion(req, res));
router.put('/questions/:id', adminAuth, (req, res) => adminController.updateQuestion(req, res));
router.delete('/questions/:id', adminAuth, (req, res) => adminController.deleteQuestion(req, res));

// Options
router.post('/questions/:questionId/options', adminAuth, (req, res) => adminController.createOption(req, res));
router.put('/options/:id', adminAuth, (req, res) => adminController.updateOption(req, res));
router.delete('/options/:id', adminAuth, (req, res) => adminController.deleteOption(req, res));

// Genetics
router.get('/genetics/scenarios', adminAuth, (req, res) => adminController.getGeneticScenarios(req, res));
router.get('/genetics/scenarios/:id', adminAuth, (req, res) => adminController.getGeneticScenario(req, res));
router.post('/genetics/scenarios', adminAuth, (req, res) => adminController.createGeneticScenario(req, res));
router.put('/genetics/scenarios/:id', adminAuth, (req, res) => adminController.updateGeneticScenario(req, res));
router.delete('/genetics/scenarios/:id', adminAuth, (req, res) => adminController.deleteGeneticScenario(req, res));

router.post('/genetics/scenarios/:scenarioId/steps', adminAuth, (req, res) => adminController.createGeneticStep(req, res));
router.put('/genetics/steps/:id', adminAuth, (req, res) => adminController.updateGeneticStep(req, res));
router.delete('/genetics/steps/:id', adminAuth, (req, res) => adminController.deleteGeneticStep(req, res));

router.post('/genetics/steps/:stepId/options', adminAuth, (req, res) => adminController.createGeneticOption(req, res));
router.put('/genetics/options/:id', adminAuth, (req, res) => adminController.updateGeneticOption(req, res));
router.delete('/genetics/options/:id', adminAuth, (req, res) => adminController.deleteGeneticOption(req, res));

export { router as adminRouter };
