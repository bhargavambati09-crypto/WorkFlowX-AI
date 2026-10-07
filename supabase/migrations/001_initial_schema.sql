-- ============================================================
-- WorkFlowX AI - Initial Schema Migration
-- Version: 001
-- Description: Creates all tables, RLS policies, indexes, and seed data
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP TABLES (for clean re-run)
-- ============================================================
DROP TABLE IF EXISTS workflow_events CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS agent_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: workflows
-- ============================================================
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT DEFAULT 'General',
  deadline TIMESTAMPTZ,
  category TEXT,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  impact TEXT CHECK (impact IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'analyzing', 'planning', 'ready', 'executing',
    'monitoring', 'blocked', 'replanning', 'awaiting_approval', 'completed', 'failed'
  )),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ai_analysis JSONB DEFAULT '{}',
  current_step TEXT,
  requires_approval BOOLEAN DEFAULT FALSE,
  health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: tasks
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_agent TEXT,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'blocked', 'completed', 'failed')),
  dependencies JSONB DEFAULT '[]',
  requires_approval BOOLEAN DEFAULT FALSE,
  deadline TIMESTAMPTZ,
  estimated_duration INTEGER DEFAULT 30, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: agent_logs
-- ============================================================
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'warning', 'idle')),
  summary TEXT,
  confidence NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: approvals
-- ============================================================
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  reason TEXT,
  ai_recommendation TEXT,
  risk_level TEXT DEFAULT 'MEDIUM' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'approval')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: workflow_events
-- ============================================================
CREATE TABLE workflow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT,
  actor_name TEXT,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_priority ON workflows(priority);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);

CREATE INDEX idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_agent ON tasks(assigned_agent);

CREATE INDEX idx_agent_logs_workflow_id ON agent_logs(workflow_id);
CREATE INDEX idx_agent_logs_timestamp ON agent_logs(timestamp DESC);
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(agent_name);

CREATE INDEX idx_approvals_workflow_id ON approvals(workflow_id);
CREATE INDEX idx_approvals_status ON approvals(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

CREATE INDEX idx_workflow_events_workflow_id ON workflow_events(workflow_id);
CREATE INDEX idx_workflow_events_type ON workflow_events(event_type);
CREATE INDEX idx_workflow_events_created_at ON workflow_events(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can only see and update their own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid()::text = id::text);

-- WORKFLOWS: Users can only CRUD their own workflows
CREATE POLICY "workflows_select_own" ON workflows FOR SELECT USING (auth.uid()::text = created_by::text);
CREATE POLICY "workflows_insert_own" ON workflows FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);
CREATE POLICY "workflows_update_own" ON workflows FOR UPDATE USING (auth.uid()::text = created_by::text);
CREATE POLICY "workflows_delete_own" ON workflows FOR DELETE USING (auth.uid()::text = created_by::text);

-- TASKS: Users can access tasks of their workflows
CREATE POLICY "tasks_select_own" ON tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM workflows WHERE workflows.id = tasks.workflow_id AND auth.uid()::text = workflows.created_by::text)
);
CREATE POLICY "tasks_insert_own" ON tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workflows WHERE workflows.id = tasks.workflow_id AND auth.uid()::text = workflows.created_by::text)
);
CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM workflows WHERE workflows.id = tasks.workflow_id AND auth.uid()::text = workflows.created_by::text)
);

-- AGENT_LOGS: Users can view logs for their workflows
CREATE POLICY "agent_logs_select_own" ON agent_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM workflows WHERE workflows.id = agent_logs.workflow_id AND auth.uid()::text = workflows.created_by::text)
);
CREATE POLICY "agent_logs_insert_own" ON agent_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workflows WHERE workflows.id = agent_logs.workflow_id AND auth.uid()::text = workflows.created_by::text)
);

-- APPROVALS: Users can access approvals for their workflows
CREATE POLICY "approvals_select_own" ON approvals FOR SELECT USING (
  EXISTS (SELECT 1 FROM workflows WHERE workflows.id = approvals.workflow_id AND auth.uid()::text = workflows.created_by::text)
);
CREATE POLICY "approvals_update_own" ON approvals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM workflows WHERE workflows.id = approvals.workflow_id AND auth.uid()::text = workflows.created_by::text)
);

-- NOTIFICATIONS: Users see their own notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid()::text = user_id::text);

-- WORKFLOW_EVENTS: Users view events for their workflows
CREATE POLICY "events_select_own" ON workflow_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM workflows WHERE workflows.id = workflow_events.workflow_id AND auth.uid()::text = workflows.created_by::text)
);

-- ============================================================
-- BACKEND SERVICE ROLE BYPASS NOTE:
-- The Express backend uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
-- RLS policies above protect direct client access.
-- All backend operations are authorized at the Express layer via JWT.
-- ============================================================

-- ============================================================
-- HELPER FUNCTION: Update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMPLETED: Schema migration 001 applied successfully
-- ============================================================
SELECT 'WorkFlowX AI schema migration 001 completed successfully' as status;
