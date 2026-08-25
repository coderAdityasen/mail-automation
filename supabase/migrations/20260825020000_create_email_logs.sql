-- Create the email_logs table for read receipts
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  recipient text NOT NULL,
  subject text,
  profile_name text,
  status text DEFAULT 'Sent',
  opened_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read and insert their own logs
CREATE POLICY "Users can read own logs" ON email_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON email_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow public updates so the tracking pixel API can update the status when an email is opened
CREATE POLICY "Allow public tracking updates" ON email_logs FOR UPDATE USING (true);
