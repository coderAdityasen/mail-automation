-- Add user_id column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- Drop the old public policies
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable delete access for all users" ON profiles;

-- Create new policies for authenticated users only
CREATE POLICY "Users can read own profiles" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profiles" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profiles" ON profiles FOR DELETE USING (auth.uid() = user_id);
