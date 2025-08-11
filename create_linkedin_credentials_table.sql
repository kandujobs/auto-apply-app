-- Create the linkedin_credentials table to store LinkedIn login information
CREATE TABLE IF NOT EXISTS linkedin_credentials (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    password_encrypted TEXT NOT NULL, -- Store encrypted password
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE linkedin_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own credentials
CREATE POLICY "Users can view own linkedin credentials" ON linkedin_credentials
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can insert their own credentials
CREATE POLICY "Users can insert own linkedin credentials" ON linkedin_credentials
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own credentials
CREATE POLICY "Users can update own linkedin credentials" ON linkedin_credentials
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can delete their own credentials
CREATE POLICY "Users can delete own linkedin credentials" ON linkedin_credentials
    FOR DELETE USING (auth.uid() = id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_linkedin_credentials_user_id ON linkedin_credentials(id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_linkedin_credentials_updated_at 
    BEFORE UPDATE ON linkedin_credentials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 