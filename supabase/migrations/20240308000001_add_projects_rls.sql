-- Enable RLS on the projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON projects
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create a policy that allows read access for anon users
CREATE POLICY "Allow read access for anon users" ON projects
    FOR SELECT
    TO anon
    USING (true); 