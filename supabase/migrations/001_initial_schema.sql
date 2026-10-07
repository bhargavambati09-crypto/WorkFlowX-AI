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
  task_order INTEGER DEFAULT 1,
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
  rejection_reason TEXT,
  notes TEXT,
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
-- SEED DATA (Hackathon Demo & Initial Enterprise Workflows)
-- ============================================================

-- 1. Default Admin & Demo Profiles
INSERT INTO profiles (id, name, email, password_hash, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Administrator', 'demo@workflowx.ai', '$2a$10$iwg3g/aJ0lbdDQUt5RdiVOZV1zdXKLHxBoMCZKmb3CmVlFHm34AQG', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Judge Evaluator', 'judge@workflowx.ai', '$2a$10$iwg3g/aJ0lbdDQUt5RdiVOZV1zdXKLHxBoMCZKmb3CmVlFHm34AQG', 'user')
ON CONFLICT (id) DO NOTHING;

-- 2. Main Hackathon Demo Workflow
-- Scenario: "A customer was charged for an order, but the order was not created."
INSERT INTO workflows (
  id, title, description, department, deadline, category, priority, impact, status,
  created_by, ai_analysis, current_step, requires_approval, health_score
)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'A customer was charged for an order, but the order was not created.',
  'Customer was billed $129.00 on Stripe (txn_89410). Payment succeeded, but the downstream order creation queue timed out. The customer submitted an urgent complaint.',
  'Billing & Fulfillment',
  NOW() + INTERVAL '24 hours',
  'Payment Issue',
  'HIGH',
  'HIGH',
  'executing',
  '00000000-0000-0000-0000-000000000001',
  '{"summary": "Payment transaction was processed successfully, but downstream order record was not generated due to asynchronous queue timeout.", "category": "Payment Issue", "priority": "HIGH", "priorityReason": "Direct financial risk and customer dissatisfaction from unfulfilled charge.", "impact": "HIGH", "impactReason": "Requires balance reconciliation and customer ticket resolution.", "confidence": 0.96, "departments": ["Finance", "Support", "Fulfillment"], "recommendedActions": ["Verify payment gateway transaction", "Inspect database records", "Approve customer refund or order reissue", "Transmit customer notification"]}'::jsonb,
  'Execution phase active with real-time agent monitoring',
  TRUE,
  92
)
ON CONFLICT (id) DO NOTHING;

-- 3. Additional Enterprise Demo Workflows (Section 31)
INSERT INTO workflows (
  id, title, description, department, deadline, category, priority, impact, status,
  created_by, ai_analysis, current_step, requires_approval, health_score
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000020',
    'Delayed Delivery in Fulfillment Center',
    'Batch shipping container #4092 held at regional logistics hub due to customs paperwork discrepancy.',
    'Logistics & Supply Chain',
    NOW() + INTERVAL '48 hours',
    'Operational Issue',
    'MEDIUM',
    'MEDIUM',
    'ready',
    '00000000-0000-0000-0000-000000000001',
    '{"summary": "Regional logistics bottleneck impacting 45 customer shipments due to import documentation.", "category": "Operational Issue", "priority": "MEDIUM", "confidence": 0.91}'::jsonb,
    'Awaiting carrier manifest update',
    FALSE,
    88
  ),
  (
    '00000000-0000-0000-0000-000000000030',
    'Employee System Access Request',
    'Senior Financial Analyst requested elevated write credentials to quarterly forecasting database.',
    'IT & Security',
    NOW() + INTERVAL '12 hours',
    'Security Issue',
    'LOW',
    'LOW',
    'awaiting_approval',
    '00000000-0000-0000-0000-000000000001',
    '{"summary": "Elevated database role provisioning requiring manager sign-off.", "category": "Security Issue", "priority": "LOW", "confidence": 0.95}'::jsonb,
    'Manager authorization pending',
    TRUE,
    95
  ),
  (
    '00000000-0000-0000-0000-000000000040',
    'IT Core Database Latency Spike',
    'Primary read-replica CPU exceeded 94% threshold causing 1200ms latency on inventory lookups.',
    'Infrastructure',
    NOW() + INTERVAL '6 hours',
    'Technical Issue',
    'CRITICAL',
    'CRITICAL',
    'monitoring',
    '00000000-0000-0000-0000-000000000001',
    '{"summary": "Critical read-replica performance degradation threatening API throughput SLAs.", "category": "Technical Issue", "priority": "CRITICAL", "confidence": 0.98}'::jsonb,
    'Auto-scaling secondary read-pool deployed',
    FALSE,
    80
  ),
  (
    '00000000-0000-0000-0000-000000000050',
    'Critical Supplier Logistics Delay',
    'Tier-1 microchip component supplier reported 10-day fabrication delay affecting assembly line 3.',
    'Procurement',
    NOW() + INTERVAL '72 hours',
    'Supply Chain Issue',
    'HIGH',
    'HIGH',
    'planning',
    '00000000-0000-0000-0000-000000000001',
    '{"summary": "Component supply shortfall requiring alternative supplier quote gathering.", "category": "Supply Chain Issue", "priority": "HIGH", "confidence": 0.89}'::jsonb,
    'Replanning inventory buffer',
    FALSE,
    85
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Tasks for the Main Demo Workflow
INSERT INTO tasks (
  id, workflow_id, title, description, assigned_agent, priority, status,
  dependencies, requires_approval, estimated_duration
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000010',
    'Verify Payment Gateway Transaction',
    'Check Stripe charge status, capture token, and verify payment legitimacy for txn_89410.',
    'Finance Agent',
    'HIGH',
    'completed',
    '[]'::jsonb,
    FALSE,
    15
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000010',
    'Inspect Order Database Records',
    'Search order fulfillment repository for orphan cart or uncommitted transactions.',
    'Technical Agent',
    'HIGH',
    'completed',
    '["Verify Payment Gateway Transaction"]'::jsonb,
    FALSE,
    20
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000010',
    'Approve Customer Refund or Order Reissue',
    'Evaluate whether to disburse refund of $129.00 or trigger priority warehouse dispatch.',
    'Manager Agent',
    'CRITICAL',
    'in_progress',
    '["Inspect Order Database Records"]'::jsonb,
    TRUE,
    15
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000010',
    'Customer Communication & Resolution Dispatch',
    'Transmit incident explanation and updated receipt/refund details to customer.',
    'Support Agent',
    'MEDIUM',
    'pending',
    '["Approve Customer Refund or Order Reissue"]'::jsonb,
    FALSE,
    10
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Agent Logs for Demo Workflow
INSERT INTO agent_logs (id, workflow_id, agent_name, action, status, summary, confidence, timestamp)
VALUES 
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000010',
    'Orchestrator',
    'Workflow received and analysis initiated',
    'completed',
    'New problem statement ingested. Orchestrator activated multi-agent pipeline.',
    0.98,
    NOW() - INTERVAL '15 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000010',
    'Analysis Agent',
    'Classified workflow priority',
    'completed',
    'Classified as HIGH priority due to direct customer financial impact and SLA risk.',
    0.96,
    NOW() - INTERVAL '14 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000010',
    'Task Planning Agent',
    'Generated 4 actionable tasks',
    'completed',
    'Synthesized dependency graph across Finance, Technical, Manager, and Support agents.',
    0.93,
    NOW() - INTERVAL '13 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000010',
    'Finance Agent',
    'Payment gateway verified',
    'completed',
    'Stripe charge txn_89410 confirmed captured ($129.00). Ledger marked paid.',
    0.97,
    NOW() - INTERVAL '10 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000205',
    '00000000-0000-0000-0000-000000000010',
    'Technical Agent',
    'Database audit completed',
    'completed',
    'Detected timeout exception in RabbitMQ order ingestion queue. No order record was committed.',
    0.95,
    NOW() - INTERVAL '6 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000206',
    '00000000-0000-0000-0000-000000000010',
    'Monitoring Agent',
    'Continuous telemetry active',
    'active',
    'All system metrics within nominal boundaries. 2 of 4 tasks completed. Awaiting authorization.',
    0.98,
    NOW() - INTERVAL '2 minutes'
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Human-in-the-Loop Approvals
INSERT INTO approvals (
  id, workflow_id, task_id, action, reason, ai_recommendation, risk_level, status
)
VALUES (
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000103',
  'Approve customer refund of $129.00',
  'Payment was charged successfully on Stripe, but downstream order creation queue timed out.',
  'Authorize customer refund to prevent chargeback and preserve customer satisfaction.',
  'MEDIUM',
  'pending'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Workflow Events Audit Log
INSERT INTO workflow_events (id, workflow_id, event_type, actor_type, actor_name, message, metadata)
VALUES 
  (
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000010',
    'ANALYSIS_STARTED',
    'Orchestrator',
    'Orchestrator',
    'Analysis pipeline initiated for workflow: A customer was charged for an order, but the order was not created.',
    '{"source": "demo"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000010',
    'PLANNING_COMPLETE',
    'Task Planning Agent',
    'Planning Agent',
    '4 tasks generated with cross-agent dependencies.',
    '{"taskCount": 4}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000403',
    '00000000-0000-0000-0000-000000000010',
    'APPROVAL_REQUESTED',
    'Manager Agent',
    'Manager Agent',
    'Human authorization requested for refund disbursement ($129.00).',
    '{"amount": 129.00}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COMPLETED: Schema migration 001 applied successfully
-- ============================================================
SELECT 'WorkFlowX AI schema migration 001 completed successfully' as status;
