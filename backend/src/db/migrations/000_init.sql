-- Users and economy
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  coins INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount INT NOT NULL,
  source TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INT DEFAULT 0
);

-- Quizzes
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('single','multiple','text')),
  question TEXT NOT NULL,
  options JSONB,
  answer JSONB,
  reward_coins INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_task_results (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Progress & achievements
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','completed')),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP DEFAULT NOW()
);

-- Assignments (2nd part)
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  requirements TEXT,
  answer_elements JSONB
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','graded','rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_reviews (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  reviewer_id INT,
  score INT,
  comment TEXT,
  checklist JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
