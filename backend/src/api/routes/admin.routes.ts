import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { openAnswersController } from '../controllers/openAnswers.controller';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.post('/login', (req, res) => adminController.login(req, res));

router.get('/users', adminAuth, (req, res) => adminController.getUsers(req, res));
router.get('/users/:id/stats', adminAuth, (req, res) => adminController.getUserStats(req, res));

router.get('/sections', adminAuth, (req, res) => adminController.getSections(req, res));
router.post('/sections', adminAuth, (req, res) => adminController.createSection(req, res));
router.delete('/sections/:id', adminAuth, (req, res) => adminController.deleteSection(req, res));

router.post('/topics', adminAuth, (req, res) => adminController.createTopic(req, res));
router.put('/topics/:id', adminAuth, (req, res) => adminController.updateTopic(req, res));
router.delete('/topics/:id', adminAuth, (req, res) => adminController.deleteTopic(req, res));

router.post('/files', adminAuth, (req, res) => adminController.createFile(req, res));
router.put('/files/:id', adminAuth, (req, res) => adminController.updateFile(req, res));
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

// Virus
router.get('/virus/cases', adminAuth, (req, res) => adminController.getVirusCases(req, res));
router.get('/virus/cases/:id', adminAuth, (req, res) => adminController.getVirusCase(req, res));
router.post('/virus/cases', adminAuth, (req, res) => adminController.createVirusCase(req, res));
router.put('/virus/cases/:id', adminAuth, (req, res) => adminController.updateVirusCase(req, res));
router.delete('/virus/cases/:id', adminAuth, (req, res) => adminController.deleteVirusCase(req, res));

router.post('/virus/cases/:caseId/clues', adminAuth, (req, res) => adminController.createVirusClue(req, res));
router.put('/virus/clues/:id', adminAuth, (req, res) => adminController.updateVirusClue(req, res));
router.delete('/virus/clues/:id', adminAuth, (req, res) => adminController.deleteVirusClue(req, res));

router.post('/virus/cases/:caseId/suspects', adminAuth, (req, res) => adminController.createVirusSuspect(req, res));
router.put('/virus/suspects/:id', adminAuth, (req, res) => adminController.updateVirusSuspect(req, res));
router.delete('/virus/suspects/:id', adminAuth, (req, res) => adminController.deleteVirusSuspect(req, res));

// Virus Chapters
router.post('/virus/cases/:caseId/chapters', adminAuth, (req, res) => adminController.createVirusChapter(req, res));
router.put('/virus/chapters/:id', adminAuth, (req, res) => adminController.updateVirusChapter(req, res));
router.delete('/virus/chapters/:id', adminAuth, (req, res) => adminController.deleteVirusChapter(req, res));

// Virus Chapter Options
router.post('/virus/chapters/:chapterId/options', adminAuth, (req, res) => adminController.createVirusChapterOption(req, res));
router.put('/virus/chapter-options/:id', adminAuth, (req, res) => adminController.updateVirusChapterOption(req, res));
router.delete('/virus/chapter-options/:id', adminAuth, (req, res) => adminController.deleteVirusChapterOption(req, res));

// Quiz categories
router.get('/quiz-categories', adminAuth, (req, res) => adminController.getQuizCategories(req, res));
router.post('/quiz-categories', adminAuth, (req, res) => adminController.createQuizCategory(req, res));
router.put('/quiz-categories/:id', adminAuth, (req, res) => adminController.updateQuizCategory(req, res));
router.delete('/quiz-categories/:id', adminAuth, (req, res) => adminController.deleteQuizCategory(req, res));

// BioGarden
router.get('/biogarden/plants', adminAuth, (req, res) => adminController.getBioGardenPlants(req, res));
router.get('/biogarden/plants/:id', adminAuth, (req, res) => adminController.getBioGardenPlant(req, res));
router.post('/biogarden/plants', adminAuth, (req, res) => adminController.createBioGardenPlant(req, res));
router.put('/biogarden/plants/:id', adminAuth, (req, res) => adminController.updateBioGardenPlant(req, res));
router.delete('/biogarden/plants/:id', adminAuth, (req, res) => adminController.deleteBioGardenPlant(req, res));

router.post('/biogarden/plants/:plantId/questions', adminAuth, (req, res) => adminController.createBioGardenQuestion(req, res));
router.put('/biogarden/questions/:id', adminAuth, (req, res) => adminController.updateBioGardenQuestion(req, res));
router.delete('/biogarden/questions/:id', adminAuth, (req, res) => adminController.deleteBioGardenQuestion(req, res));

router.post('/biogarden/questions/:questionId/options', adminAuth, (req, res) => adminController.createBioGardenOption(req, res));
router.put('/biogarden/options/:id', adminAuth, (req, res) => adminController.updateBioGardenOption(req, res));
router.delete('/biogarden/options/:id', adminAuth, (req, res) => adminController.deleteBioGardenOption(req, res));

// Open answers review
router.get('/open-answers', adminAuth, (req, res) => openAnswersController.adminList(req, res));
router.put('/open-answers/:id/review', adminAuth, (req, res) => openAnswersController.adminReview(req, res));

export { router as adminRouter };
