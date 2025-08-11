-- Create worker_messages table to store real-time worker activity
CREATE TABLE IF NOT EXISTS worker_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('info', 'success', 'error', 'warning')),
  step_name VARCHAR(100),
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying by user and job
CREATE INDEX IF NOT EXISTS idx_worker_messages_user_job ON worker_messages(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_worker_messages_created_at ON worker_messages(created_at DESC);

-- Enable RLS
ALTER TABLE worker_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own worker messages" ON worker_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own worker messages" ON worker_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_worker_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_worker_messages_updated_at
  BEFORE UPDATE ON worker_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_messages_updated_at(); 