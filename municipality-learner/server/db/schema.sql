-- Municipality Learner Database Schema

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS municipalities CASCADE;
DROP TABLE IF EXISTS countries CASCADE;

-- Countries table
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    municipality_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Municipalities table
CREATE TABLE municipalities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
    audio_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User progress table (tracks spaced repetition data)
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    municipality_id INTEGER REFERENCES municipalities(id) ON DELETE CASCADE UNIQUE,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    ease_factor DECIMAL(4,2) DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    last_seen TIMESTAMP,
    next_review TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily statistics table
CREATE TABLE daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    unlocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_municipalities_country ON municipalities(country_id);
CREATE INDEX idx_user_progress_next_review ON user_progress(next_review);
CREATE INDEX idx_user_progress_municipality ON user_progress(municipality_id);
CREATE INDEX idx_daily_stats_date ON daily_stats(date);

-- Insert default achievements
INSERT INTO achievements (code, name, description, icon) VALUES
('first_correct', 'First Steps', 'Answer your first question correctly', '🎯'),
('streak_3', 'Getting Started', 'Maintain a 3-day streak', '🔥'),
('streak_7', 'Week Warrior', 'Maintain a 7-day streak', '⚡'),
('streak_30', 'Month Master', 'Maintain a 30-day streak', '🏆'),
('country_25', 'Quarter Way', 'Learn 25% of a country', '📊'),
('country_50', 'Halfway There', 'Learn 50% of a country', '📈'),
('country_75', 'Almost There', 'Learn 75% of a country', '🎖️'),
('country_100', 'Country Master', 'Master all municipalities in a country', '👑'),
('perfect_10', 'Perfect Ten', 'Get 10 correct answers in a row', '✨'),
('century', 'Century Club', 'Answer 100 questions total', '💯');
