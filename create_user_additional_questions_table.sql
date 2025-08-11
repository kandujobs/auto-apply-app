-- Table for storing user answers to additional questions from LinkedIn applications
CREATE TABLE IF NOT EXISTS user_additional_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'text', 'textarea', 'select'
    answer TEXT NOT NULL,
    job_id TEXT, -- LinkedIn job ID
    job_title TEXT,
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_additional_questions_user_id ON user_additional_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_additional_questions_question_text ON user_additional_questions(question_text);
CREATE INDEX IF NOT EXISTS idx_user_additional_questions_job_id ON user_additional_questions(job_id);

-- Enable RLS
ALTER TABLE user_additional_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own additional questions" ON user_additional_questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own additional questions" ON user_additional_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own additional questions" ON user_additional_questions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own additional questions" ON user_additional_questions
    FOR DELETE USING (auth.uid() = user_id); 