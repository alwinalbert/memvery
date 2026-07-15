-- Migration to add Domain Knowledge Projects
-- Projects are containers that group content items for scoped AI chats

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_items junction table to link projects with jobs
CREATE TABLE IF NOT EXISTS project_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, job_id)
);

-- Create indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_project_items_project_id ON project_items(project_id);
CREATE INDEX idx_project_items_job_id ON project_items(job_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for project_items
CREATE POLICY "Users can view items in their projects"
  ON project_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to their projects"
  ON project_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from their projects"
  ON project_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Service role policies for backend operations
CREATE POLICY "Service role can manage projects"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage project_items"
  ON project_items FOR ALL
  USING (true)
  WITH CHECK (true);
