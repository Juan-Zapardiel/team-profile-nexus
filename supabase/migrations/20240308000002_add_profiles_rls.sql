-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read all profiles
CREATE POLICY "Allow read access for authenticated users" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Create a policy that allows users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create a policy that allows users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create a policy that allows users to delete their own profile
CREATE POLICY "Allow users to delete their own profile" ON profiles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- Create a policy that allows service role to manage profiles
CREATE POLICY "Allow service role to manage profiles" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true); 