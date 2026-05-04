import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, MaterialSection, MaterialTopic, MaterialFile, Quiz, QuizQuestion, QuizOption, GeneticScenario, GeneticStep, GeneticOption } from '../../models';
import { DownloadableTask, TaskCollection, TaskCollectionItem } from '../../models/DownloadableTask';

const SECRET = process.env.JWT_SECRET || 'dev-only-change-me-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

class AdminController {
	// ── Auth ──────────────────────────────────────────────────────────────────
	async login(req: Request, res: Response) {
		try {
			const { password } = req.body as { password?: string };
			if (!password || password !== ADMIN_PASSWORD) {
				return res.status(401).json({ success: false, message: 'Неверный пароль' });
			}
			const token = jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '8h' });
			return res.json({ success: true, data: { token } });
		} catch (e) {
			console.error('Admin login error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сервера' });
		}
	}

	// ── Users ─────────────────────────────────────────────────────────────────
	async getUsers(_req: Request, res: Response) {
		try {
			const users = await User.findAll({
				attributes: ['id', 'email', 'username', 'telegram_id', 'coins', 'created_at'],
				order: [['created_at', 'DESC']],
			});
			return res.json({ success: true, data: { users } });
		} catch (e) {
			console.error('Admin getUsers error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сервера' });
		}
	}

	// ── Materials ─────────────────────────────────────────────────────────────
	async getSections(_req: Request, res: Response) {
		try {
			const sections = await MaterialSection.findAll({
				order: [['order_index', 'ASC']],
				include: [{
					model: MaterialTopic,
					as: 'topics',
					include: [{ model: MaterialFile, as: 'files' }],
				}],
			});
			return res.json({ success: true, data: { sections } });
		} catch (e) {
			console.error('Admin getSections error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сервера' });
		}
	}

	async createSection(req: Request, res: Response) {
		try {
			const { title, slug, description, icon, order_index } = req.body as {
				title?: string; slug?: string; description?: string; icon?: string; order_index?: number;
			};
			if (!title || !slug) {
				return res.status(400).json({ success: false, message: 'title и slug обязательны' });
			}
			const section = await MaterialSection.create({
				title,
				slug,
				description: description ?? null,
				icon: icon ?? null,
				order_index: order_index ?? 0,
			});
			return res.status(201).json({ success: true, data: { section } });
		} catch (e) {
			console.error('Admin createSection error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания раздела' });
		}
	}

	async deleteSection(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const topics = await MaterialTopic.findAll({ where: { section_id: id } });
			for (const topic of topics) {
				await MaterialFile.destroy({ where: { topic_id: topic.id } });
			}
			await MaterialTopic.destroy({ where: { section_id: id } });
			await MaterialSection.destroy({ where: { id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteSection error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления' });
		}
	}

	async createTopic(req: Request, res: Response) {
		try {
			const { section_id, title, slug, description, price_repcoins, is_default_unlocked, order_index } = req.body as {
				section_id?: number; title?: string; slug?: string; description?: string;
				price_repcoins?: number; is_default_unlocked?: boolean; order_index?: number;
			};
			if (!section_id || !title || !slug) {
				return res.status(400).json({ success: false, message: 'section_id, title и slug обязательны' });
			}
			const topic = await MaterialTopic.create({
				section_id,
				title,
				slug,
				description: description ?? null,
				price_repcoins: price_repcoins ?? 0,
				is_default_unlocked: is_default_unlocked ?? false,
				order_index: order_index ?? 0,
			});
			return res.status(201).json({ success: true, data: { topic } });
		} catch (e) {
			console.error('Admin createTopic error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания темы' });
		}
	}

	async deleteTopic(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			await MaterialFile.destroy({ where: { topic_id: id } });
			await MaterialTopic.destroy({ where: { id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteTopic error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления' });
		}
	}

	async createFile(req: Request, res: Response) {
		try {
			const { topic_id, name, file_url, file_type, file_size } = req.body as {
				topic_id?: number; name?: string; file_url?: string;
				file_type?: 'word' | 'pdf' | 'zip' | 'other'; file_size?: number;
			};
			if (!topic_id || !name || !file_url) {
				return res.status(400).json({ success: false, message: 'topic_id, name и file_url обязательны' });
			}
			const file = await MaterialFile.create({
				topic_id,
				name,
				file_url,
				file_type: file_type ?? 'other',
				file_size: file_size ?? null,
			});
			return res.status(201).json({ success: true, data: { file } });
		} catch (e) {
			console.error('Admin createFile error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания файла' });
		}
	}

	async deleteFile(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			await MaterialFile.destroy({ where: { id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteFile error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления' });
		}
	}

	// ── Downloadable Tasks ────────────────────────────────────────────────────
	async getTasks(_req: Request, res: Response) {
		try {
			const tasks = await DownloadableTask.findAll({
				order: [['created_at', 'DESC']],
			});
			return res.json({ success: true, data: { tasks } });
		} catch (e) {
			console.error('Admin getTasks error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сервера' });
		}
	}

	async createTask(req: Request, res: Response) {
		try {
			const { title, source, description, file_url, file_type, file_size, year, subject } = req.body as {
				title?: string;
				source?: 'ege' | 'fipi' | 'other';
				description?: string;
				file_url?: string;
				file_type?: 'word' | 'pdf' | 'zip' | 'other';
				file_size?: number;
				year?: number;
				subject?: string;
			};
			if (!title || !source || !file_url) {
				return res.status(400).json({ success: false, message: 'title, source и file_url обязательны' });
			}
			const task = await DownloadableTask.create({
				title,
				source,
				description: description ?? null,
				file_url,
				file_type: file_type ?? 'pdf',
				file_size: file_size ?? null,
				year: year ?? null,
				subject: subject ?? null,
			});
			return res.status(201).json({ success: true, data: { task } });
		} catch (e) {
			console.error('Admin createTask error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания задания' });
		}
	}

	async deleteTask(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			await TaskCollectionItem.destroy({ where: { task_id: id } });
			await DownloadableTask.destroy({ where: { id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteTask error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления' });
		}
	}

	// ── Task Collections ──────────────────────────────────────────────────────
	async getCollections(_req: Request, res: Response) {
		try {
			const collections = await TaskCollection.findAll({
				order: [['created_at', 'DESC']],
				include: [{
					model: DownloadableTask,
					as: 'tasks',
					through: { attributes: ['order_index'] },
				}],
			});
			return res.json({ success: true, data: { collections } });
		} catch (e) {
			console.error('Admin getCollections error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сервера' });
		}
	}

	async createCollection(req: Request, res: Response) {
		try {
			const { title, source, description } = req.body as {
				title?: string; source?: 'ege' | 'fipi' | 'other'; description?: string;
			};
			if (!title || !source) {
				return res.status(400).json({ success: false, message: 'title и source обязательны' });
			}
			const collection = await TaskCollection.create({
				title,
				source,
				description: description ?? null,
			});
			return res.status(201).json({ success: true, data: { collection } });
		} catch (e) {
			console.error('Admin createCollection error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания коллекции' });
		}
	}

	async deleteCollection(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			await TaskCollectionItem.destroy({ where: { collection_id: id } });
			await TaskCollection.destroy({ where: { id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteCollection error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления' });
		}
	}

	async addTaskToCollection(req: Request, res: Response) {
		try {
			const collection_id = Number(req.params.id);
			const { task_id, order_index } = req.body as { task_id?: number; order_index?: number };
			if (!task_id) {
				return res.status(400).json({ success: false, message: 'task_id обязателен' });
			}
			const existing = await TaskCollectionItem.findOne({ where: { collection_id, task_id } });
			if (existing) {
				return res.status(409).json({ success: false, message: 'Задание уже в коллекции' });
			}
			await TaskCollectionItem.create({ collection_id, task_id, order_index: order_index ?? 0 });
			return res.status(201).json({ success: true });
		} catch (e) {
			console.error('Admin addTaskToCollection error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка добавления' });
		}
	}

	async removeTaskFromCollection(req: Request, res: Response) {
		try {
			const collection_id = Number(req.params.id);
			const task_id = Number(req.params.taskId);
			await TaskCollectionItem.destroy({ where: { collection_id, task_id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin removeTaskFromCollection error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления' });
		}
	}

	// ── Quizzes ───────────────────────────────────────────────────────────────
	async getQuizzes(_req: Request, res: Response) {
		try {
			const quizzes = await Quiz.findAll({
				order: [['created_at', 'DESC']],
				include: [{ model: QuizQuestion, as: 'questions', attributes: ['id'] }],
			});
			return res.json({ success: true, data: { quizzes } });
		} catch (e) {
			console.error('Admin getQuizzes error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сервера' });
		}
	}

	async getQuiz(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const quiz = await Quiz.findByPk(id, {
				include: [{
					model: QuizQuestion,
					as: 'questions',
					include: [{ model: QuizOption, as: 'options' }],
				}],
			});
			if (!quiz) return res.status(404).json({ success: false, message: 'Тест не найден' });
			return res.json({ success: true, data: { quiz } });
		} catch (e) {
			console.error('Admin getQuiz error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сервера' });
		}
	}

	async createQuiz(req: Request, res: Response) {
		try {
			const { title, description, coins_reward, difficulty, topic_tag, estimated_minutes, is_active } = req.body as {
				title?: string; description?: string; coins_reward?: number;
				difficulty?: 'easy' | 'medium' | 'hard'; topic_tag?: string;
				estimated_minutes?: number; is_active?: boolean;
			};
			if (!title) return res.status(400).json({ success: false, message: 'title обязателен' });
			const quiz = await Quiz.create({
				title,
				description: description ?? null,
				coins_reward: coins_reward ?? 0,
				difficulty: difficulty ?? 'medium',
				topic_tag: topic_tag ?? null,
				estimated_minutes: estimated_minutes ?? null,
				is_active: is_active ?? true,
				total_questions: 0,
				total_points: 0,
			});
			return res.status(201).json({ success: true, data: { quiz } });
		} catch (e) {
			console.error('Admin createQuiz error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания теста' });
		}
	}

	async updateQuiz(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const { title, description, coins_reward, difficulty, topic_tag, estimated_minutes, is_active } = req.body as {
				title?: string; description?: string; coins_reward?: number;
				difficulty?: 'easy' | 'medium' | 'hard'; topic_tag?: string;
				estimated_minutes?: number; is_active?: boolean;
			};
			const quiz = await Quiz.findByPk(id);
			if (!quiz) return res.status(404).json({ success: false, message: 'Тест не найден' });
			await quiz.update({
				...(title !== undefined && { title }),
				...(description !== undefined && { description }),
				...(coins_reward !== undefined && { coins_reward }),
				...(difficulty !== undefined && { difficulty }),
				...(topic_tag !== undefined && { topic_tag }),
				...(estimated_minutes !== undefined && { estimated_minutes }),
				...(is_active !== undefined && { is_active }),
			});
			return res.json({ success: true, data: { quiz } });
		} catch (e) {
			console.error('Admin updateQuiz error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка обновления теста' });
		}
	}

	async deleteQuiz(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const questions = await QuizQuestion.findAll({ where: { quiz_id: id } });
			for (const q of questions) {
				await QuizOption.destroy({ where: { question_id: q.id } });
			}
			await QuizQuestion.destroy({ where: { quiz_id: id } });
			await Quiz.destroy({ where: { id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteQuiz error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления теста' });
		}
	}

	// ── Quiz Questions ────────────────────────────────────────────────────────
	async createQuestion(req: Request, res: Response) {
		try {
			const quiz_id = Number(req.params.quizId);
			const { question_text, question_type, points, timer_seconds, explanation, order_index } = req.body as {
				question_text?: string; question_type?: 'single_choice' | 'multiple_choice' | 'true_false';
				points?: number; timer_seconds?: number; explanation?: string; order_index?: number;
			};
			if (!question_text || !question_type) {
				return res.status(400).json({ success: false, message: 'question_text и question_type обязательны' });
			}
			const question = await QuizQuestion.create({
				quiz_id,
				question_text,
				question_type,
				points: points ?? 1,
				timer_seconds: timer_seconds ?? null,
				explanation: explanation ?? null,
				order_index: order_index ?? 0,
			});
			await this._recalcQuizTotals(quiz_id);
			return res.status(201).json({ success: true, data: { question } });
		} catch (e) {
			console.error('Admin createQuestion error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания вопроса' });
		}
	}

	async updateQuestion(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const { question_text, question_type, points, timer_seconds, explanation, order_index } = req.body as {
				question_text?: string; question_type?: 'single_choice' | 'multiple_choice' | 'true_false';
				points?: number; timer_seconds?: number | null; explanation?: string | null; order_index?: number;
			};
			const question = await QuizQuestion.findByPk(id);
			if (!question) return res.status(404).json({ success: false, message: 'Вопрос не найден' });
			await question.update({
				...(question_text !== undefined && { question_text }),
				...(question_type !== undefined && { question_type }),
				...(points !== undefined && { points }),
				...(timer_seconds !== undefined && { timer_seconds }),
				...(explanation !== undefined && { explanation }),
				...(order_index !== undefined && { order_index }),
			});
			await this._recalcQuizTotals(question.quiz_id);
			return res.json({ success: true, data: { question } });
		} catch (e) {
			console.error('Admin updateQuestion error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка обновления вопроса' });
		}
	}

	async deleteQuestion(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const question = await QuizQuestion.findByPk(id);
			if (!question) return res.status(404).json({ success: false, message: 'Вопрос не найден' });
			const quiz_id = question.quiz_id;
			await QuizOption.destroy({ where: { question_id: id } });
			await QuizQuestion.destroy({ where: { id } });
			await this._recalcQuizTotals(quiz_id);
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteQuestion error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления вопроса' });
		}
	}

	// ── Quiz Options ──────────────────────────────────────────────────────────
	async createOption(req: Request, res: Response) {
		try {
			const question_id = Number(req.params.questionId);
			const { option_text, is_correct, order_index } = req.body as {
				option_text?: string; is_correct?: boolean; order_index?: number;
			};
			if (!option_text) return res.status(400).json({ success: false, message: 'option_text обязателен' });
			const option = await QuizOption.create({
				question_id,
				option_text,
				is_correct: is_correct ?? false,
				order_index: order_index ?? 0,
			});
			return res.status(201).json({ success: true, data: { option } });
		} catch (e) {
			console.error('Admin createOption error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания варианта' });
		}
	}

	async updateOption(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const { option_text, is_correct, order_index } = req.body as {
				option_text?: string; is_correct?: boolean; order_index?: number;
			};
			const option = await QuizOption.findByPk(id);
			if (!option) return res.status(404).json({ success: false, message: 'Вариант не найден' });
			await option.update({
				...(option_text !== undefined && { option_text }),
				...(is_correct !== undefined && { is_correct }),
				...(order_index !== undefined && { order_index }),
			});
			return res.json({ success: true, data: { option } });
		} catch (e) {
			console.error('Admin updateOption error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка обновления варианта' });
		}
	}

	async deleteOption(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			await QuizOption.destroy({ where: { id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteOption error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления варианта' });
		}
	}

	private async _recalcQuizTotals(quiz_id: number) {
		const allQuestions = await QuizQuestion.findAll({ where: { quiz_id } });
		await Quiz.update(
			{
				total_questions: allQuestions.length,
				total_points: allQuestions.reduce((sum, q) => sum + q.points, 0),
			},
			{ where: { id: quiz_id } }
		);
	}

	// ── Genetic Scenarios ─────────────────────────────────────────────────────
	async getGeneticScenarios(_req: Request, res: Response) {
		try {
			const scenarios = await GeneticScenario.findAll({
				order: [['order_index', 'ASC'], ['created_at', 'ASC']],
				include: [{ model: GeneticStep, as: 'steps', attributes: ['id'] }],
			});
			return res.json({ success: true, data: { scenarios } });
		} catch (e) {
			console.error('Admin getGeneticScenarios error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сервера' });
		}
	}

	async getGeneticScenario(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const scenario = await GeneticScenario.findByPk(id, {
				include: [{
					model: GeneticStep,
					as: 'steps',
					include: [{ model: GeneticOption, as: 'options' }],
				}],
			});
			if (!scenario) return res.status(404).json({ success: false, message: 'Сценарий не найден' });
			const plain = scenario.get({ plain: true }) as any;
			plain.steps = (plain.steps ?? [])
				.sort((a: any, b: any) => a.order_index - b.order_index)
				.map((s: any) => ({ ...s, options: (s.options ?? []).sort((a: any, b: any) => a.order_index - b.order_index) }));
			return res.json({ success: true, data: { scenario: plain } });
		} catch (e) {
			console.error('Admin getGeneticScenario error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка сервера' });
		}
	}

	async createGeneticScenario(req: Request, res: Response) {
		try {
			const { title, description, difficulty, coins_reward, is_active, order_index } = req.body as {
				title?: string; description?: string; difficulty?: 'easy' | 'medium' | 'hard';
				coins_reward?: number; is_active?: boolean; order_index?: number;
			};
			if (!title) return res.status(400).json({ success: false, message: 'title обязателен' });
			const scenario = await GeneticScenario.create({
				title, description: description ?? null,
				difficulty: difficulty ?? 'medium',
				coins_reward: coins_reward ?? 0,
				is_active: is_active ?? true,
				order_index: order_index ?? 0,
			});
			return res.status(201).json({ success: true, data: { scenario } });
		} catch (e) {
			console.error('Admin createGeneticScenario error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания сценария' });
		}
	}

	async updateGeneticScenario(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const { title, description, difficulty, coins_reward, is_active, order_index } = req.body as {
				title?: string; description?: string | null; difficulty?: 'easy' | 'medium' | 'hard';
				coins_reward?: number; is_active?: boolean; order_index?: number;
			};
			const scenario = await GeneticScenario.findByPk(id);
			if (!scenario) return res.status(404).json({ success: false, message: 'Сценарий не найден' });
			await scenario.update({
				...(title !== undefined && { title }),
				...(description !== undefined && { description }),
				...(difficulty !== undefined && { difficulty }),
				...(coins_reward !== undefined && { coins_reward }),
				...(is_active !== undefined && { is_active }),
				...(order_index !== undefined && { order_index }),
			});
			return res.json({ success: true, data: { scenario } });
		} catch (e) {
			console.error('Admin updateGeneticScenario error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка обновления' });
		}
	}

	async deleteGeneticScenario(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const steps = await GeneticStep.findAll({ where: { scenario_id: id } });
			for (const step of steps) {
				await GeneticOption.destroy({ where: { step_id: step.id } });
			}
			await GeneticStep.destroy({ where: { scenario_id: id } });
			await GeneticScenario.destroy({ where: { id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteGeneticScenario error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления' });
		}
	}

	// ── Genetic Steps ─────────────────────────────────────────────────────────
	async createGeneticStep(req: Request, res: Response) {
		try {
			const scenario_id = Number(req.params.scenarioId);
			const { step_type, title, content, points, explanation, order_index } = req.body as {
				step_type?: 'info' | 'question' | 'result'; title?: string; content?: string;
				points?: number; explanation?: string; order_index?: number;
			};
			if (!step_type || !title || !content) {
				return res.status(400).json({ success: false, message: 'step_type, title и content обязательны' });
			}
			const step = await GeneticStep.create({
				scenario_id, step_type, title, content,
				points: points ?? 0,
				explanation: explanation ?? null,
				order_index: order_index ?? 0,
			});
			return res.status(201).json({ success: true, data: { step } });
		} catch (e) {
			console.error('Admin createGeneticStep error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания шага' });
		}
	}

	async updateGeneticStep(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const { step_type, title, content, points, explanation, order_index } = req.body as {
				step_type?: 'info' | 'question' | 'result'; title?: string; content?: string;
				points?: number; explanation?: string | null; order_index?: number;
			};
			const step = await GeneticStep.findByPk(id);
			if (!step) return res.status(404).json({ success: false, message: 'Шаг не найден' });
			await step.update({
				...(step_type !== undefined && { step_type }),
				...(title !== undefined && { title }),
				...(content !== undefined && { content }),
				...(points !== undefined && { points }),
				...(explanation !== undefined && { explanation }),
				...(order_index !== undefined && { order_index }),
			});
			return res.json({ success: true, data: { step } });
		} catch (e) {
			console.error('Admin updateGeneticStep error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка обновления шага' });
		}
	}

	async deleteGeneticStep(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			await GeneticOption.destroy({ where: { step_id: id } });
			await GeneticStep.destroy({ where: { id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteGeneticStep error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления шага' });
		}
	}

	// ── Genetic Options ───────────────────────────────────────────────────────
	async createGeneticOption(req: Request, res: Response) {
		try {
			const step_id = Number(req.params.stepId);
			const { option_text, is_correct, feedback, order_index } = req.body as {
				option_text?: string; is_correct?: boolean; feedback?: string; order_index?: number;
			};
			if (!option_text) return res.status(400).json({ success: false, message: 'option_text обязателен' });
			const option = await GeneticOption.create({
				step_id, option_text,
				is_correct: is_correct ?? false,
				feedback: feedback ?? null,
				order_index: order_index ?? 0,
			});
			return res.status(201).json({ success: true, data: { option } });
		} catch (e) {
			console.error('Admin createGeneticOption error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка создания варианта' });
		}
	}

	async updateGeneticOption(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			const { option_text, is_correct, feedback, order_index } = req.body as {
				option_text?: string; is_correct?: boolean; feedback?: string | null; order_index?: number;
			};
			const option = await GeneticOption.findByPk(id);
			if (!option) return res.status(404).json({ success: false, message: 'Вариант не найден' });
			await option.update({
				...(option_text !== undefined && { option_text }),
				...(is_correct !== undefined && { is_correct }),
				...(feedback !== undefined && { feedback }),
				...(order_index !== undefined && { order_index }),
			});
			return res.json({ success: true, data: { option } });
		} catch (e) {
			console.error('Admin updateGeneticOption error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка обновления варианта' });
		}
	}

	async deleteGeneticOption(req: Request, res: Response) {
		try {
			const id = Number(req.params.id);
			await GeneticOption.destroy({ where: { id } });
			return res.json({ success: true });
		} catch (e) {
			console.error('Admin deleteGeneticOption error:', e);
			return res.status(500).json({ success: false, message: 'Ошибка удаления варианта' });
		}
	}
}

export const adminController = new AdminController();
