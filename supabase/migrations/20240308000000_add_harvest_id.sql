-- Add harvest_id column to projects table
ALTER TABLE projects ADD COLUMN harvest_id TEXT;

-- Create an index on harvest_id for faster lookups
CREATE INDEX idx_projects_harvest_id ON projects(harvest_id);
 
-- Add a unique constraint to ensure we don't have duplicate Harvest projects
ALTER TABLE projects ADD CONSTRAINT unique_harvest_id UNIQUE (harvest_id); 