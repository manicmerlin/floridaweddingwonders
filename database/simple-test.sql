-- Simple test - create just the email_subscribers table first
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  venue_name TEXT,
  is_venue_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert
CREATE POLICY "Allow public insert to email_subscribers" ON email_subscribers
  FOR INSERT WITH CHECK (true);
