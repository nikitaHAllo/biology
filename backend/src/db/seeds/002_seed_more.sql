-- Extra lessons and tasks with explanations
WITH c AS (
  SELECT id FROM courses WHERE title = 'Биология. Введение' LIMIT 1
), l2 AS (
  INSERT INTO lessons (course_id, title, content, order_index)
  SELECT id, 'Органоиды клетки', 'Описание органоидов...', 2 FROM c
  RETURNING id
), l3 AS (
  INSERT INTO lessons (course_id, title, content, order_index)
  SELECT id, 'Деление клетки', 'Митоз и мейоз...', 3 FROM c
  RETURNING id
)
INSERT INTO tasks (lesson_id, type, question, options, answer, reward_coins)
SELECT (SELECT id FROM l2), 'single', 'Где синтезируются белки?', '["Митохондрии","Рибосомы","Лизосомы","Аппарат Гольджи"]'::jsonb, '"Рибосомы"'::jsonb, 5
ON CONFLICT DO NOTHING;

INSERT INTO tasks (lesson_id, type, question, options, answer, reward_coins)
SELECT (SELECT id FROM l3), 'single', 'Сколько фаз включает митоз?', '["2","4","5","6"]'::jsonb, '"4"'::jsonb, 5
ON CONFLICT DO NOTHING;
