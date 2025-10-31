INSERT INTO courses (title, description) VALUES ('Биология. Введение', 'Базовые понятия') ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, content, order_index)
SELECT c.id, 'Клетка и её строение', 'Материалы урока...', 1 FROM courses c WHERE c.title = 'Биология. Введение' LIMIT 1;

INSERT INTO tasks (lesson_id, type, question, options, answer, reward_coins)
SELECT l.id, 'single', 'Основная структурная единица жизни?', '["Клетка","Орган","Ткань","Система органов"]'::jsonb, '"Клетка"'::jsonb, 5 FROM lessons l
JOIN courses c ON c.id = l.course_id
WHERE c.title = 'Биология. Введение' AND l.title = 'Клетка и её строение' LIMIT 1;

INSERT INTO assignments (lesson_id, title, requirements, answer_elements)
SELECT l.id, 'Эссе: роль клеточной мембраны', 'Напишите эссе на 200-300 слов', '["полупроницаемость","двойной липидный слой","транспорт веществ"]'::jsonb FROM lessons l
JOIN courses c ON c.id = l.course_id
WHERE c.title = 'Биология. Введение' AND l.title = 'Клетка и её строение' LIMIT 1;
