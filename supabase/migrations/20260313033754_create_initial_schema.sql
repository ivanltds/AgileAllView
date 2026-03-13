/*
  # AgileAllView Initial Schema

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text, team name)
      - `organization` (text, Azure DevOps organization)
      - `project` (text, Azure DevOps project)
      - `team_id` (text, Azure DevOps team ID)
      - `area_path` (text, board area path)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `work_items`
      - `id` (integer, primary key, work item ID from Azure)
      - `team_id` (uuid, foreign key to teams)
      - `title` (text)
      - `work_item_type` (text, e.g., PBI, Task, Bug)
      - `state` (text, current state)
      - `story_points` (numeric, story points assigned)
      - `created_date` (timestamp)
      - `closed_date` (timestamp)
      - `assigned_to` (text)
      - `iteration_path` (text)
      - `area_path` (text)
      - `raw_data` (jsonb, full work item data)
      - `synced_at` (timestamp)
    
    - `revisions`
      - `id` (uuid, primary key)
      - `work_item_id` (integer, foreign key to work_items)
      - `rev` (integer, revision number)
      - `revised_date` (timestamp)
      - `revised_by` (text)
      - `state` (text, state at this revision)
      - `changed_fields` (jsonb)
      - `raw_data` (jsonb)
    
    - `iterations`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `iteration_id` (text, Azure iteration ID)
      - `name` (text)
      - `path` (text)
      - `start_date` (date)
      - `finish_date` (date)
      - `synced_at` (timestamp)
    
    - `capacity`
      - `id` (uuid, primary key)
      - `iteration_id` (uuid, foreign key to iterations)
      - `team_member_id` (text)
      - `team_member_name` (text)
      - `activity_name` (text, e.g., Development, Testing, Design)
      - `capacity_per_day` (numeric)
      - `days_off` (jsonb, array of dates)
      - `synced_at` (timestamp)
    
    - `metrics`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `work_item_id` (integer, foreign key to work_items)
      - `iteration_id` (uuid, foreign key to iterations)
      - `lead_time_days` (numeric)
      - `cycle_time_days` (numeric)
      - `time_in_states` (jsonb, time spent in each state)
      - `calculated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since auth is in-memory)
*/

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization text NOT NULL,
  project text NOT NULL,
  team_id text NOT NULL,
  area_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_items (
  id integer PRIMARY KEY,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  work_item_type text NOT NULL,
  state text NOT NULL,
  story_points numeric DEFAULT 0,
  created_date timestamptz,
  closed_date timestamptz,
  assigned_to text,
  iteration_path text,
  area_path text,
  raw_data jsonb DEFAULT '{}'::jsonb,
  synced_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id integer REFERENCES work_items(id) ON DELETE CASCADE,
  rev integer NOT NULL,
  revised_date timestamptz NOT NULL,
  revised_by text,
  state text,
  changed_fields jsonb DEFAULT '{}'::jsonb,
  raw_data jsonb DEFAULT '{}'::jsonb,
  UNIQUE(work_item_id, rev)
);

CREATE TABLE IF NOT EXISTS iterations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  iteration_id text NOT NULL,
  name text NOT NULL,
  path text NOT NULL,
  start_date date NOT NULL,
  finish_date date NOT NULL,
  synced_at timestamptz DEFAULT now(),
  UNIQUE(team_id, iteration_id)
);

CREATE TABLE IF NOT EXISTS capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iteration_id uuid REFERENCES iterations(id) ON DELETE CASCADE,
  team_member_id text NOT NULL,
  team_member_name text NOT NULL,
  activity_name text NOT NULL,
  capacity_per_day numeric DEFAULT 0,
  days_off jsonb DEFAULT '[]'::jsonb,
  synced_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  work_item_id integer REFERENCES work_items(id) ON DELETE CASCADE,
  iteration_id uuid REFERENCES iterations(id) ON DELETE CASCADE,
  lead_time_days numeric DEFAULT 0,
  cycle_time_days numeric DEFAULT 0,
  time_in_states jsonb DEFAULT '{}'::jsonb,
  calculated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to teams"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to teams"
  ON teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to teams"
  ON teams FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from teams"
  ON teams FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to work_items"
  ON work_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to work_items"
  ON work_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to work_items"
  ON work_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from work_items"
  ON work_items FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to revisions"
  ON revisions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to revisions"
  ON revisions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to iterations"
  ON iterations FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to iterations"
  ON iterations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to capacity"
  ON capacity FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to capacity"
  ON capacity FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to metrics"
  ON metrics FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to metrics"
  ON metrics FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_work_items_team_id ON work_items(team_id);
CREATE INDEX IF NOT EXISTS idx_work_items_iteration_path ON work_items(iteration_path);
CREATE INDEX IF NOT EXISTS idx_revisions_work_item_id ON revisions(work_item_id);
CREATE INDEX IF NOT EXISTS idx_revisions_revised_date ON revisions(revised_date);
CREATE INDEX IF NOT EXISTS idx_iterations_team_id ON iterations(team_id);
CREATE INDEX IF NOT EXISTS idx_capacity_iteration_id ON capacity(iteration_id);
CREATE INDEX IF NOT EXISTS idx_metrics_team_id ON metrics(team_id);
CREATE INDEX IF NOT EXISTS idx_metrics_work_item_id ON metrics(work_item_id);
