-- ============================================================
-- WorkFlowX AI - Database Seed Data
-- Version: 001
-- Description: Initial test and demo records for WorkFlowX AI
-- ============================================================

-- Seed Profiles
INSERT INTO profiles (id, name, email, password_hash, role, created_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'Demo Administrator',
    'demo@workflowx.ai',
    '$2a$10$wK1Rk7yN9o47uCshf3R7xe7V52j3Zk06lT.j9RvhQO4M1WbV6b6kS',
    'admin',
    NOW() - INTERVAL '14 days'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Operations Lead',
    'operator@workflowx.ai',
    '$2a$10$wK1Rk7yN9o47uCshf3R7xe7V52j3Zk06lT.j9RvhQO4M1WbV6b6kS',
    'user',
    NOW() - INTERVAL '10 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Workflows
INSERT INTO workflows (
  id,
  title,
  description,
  department,
  deadline,
  category,
  priority,
  impact,
  status,
  created_by,
  ai_analysis,
  current_step,
  requires_approval,
  health_score,
  created_at,
  updated_at
)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'Cross-Border Invoice Reconciliation & Settlement',
    'End-to-end multi-agent orchestration to validate inventory, process international wire settlements, and handle cross-border duty compliance.',
    'Billing & Fulfillment',
    NOW() + INTERVAL '2 days',
    'Financial Operations',
    'HIGH',
    'CRITICAL',
    'executing',
    '00000000-0000-0000-0000-000000000001',
    '{"summary": "High complexity financial transaction with cross-border dependencies.", "risk_level": "MEDIUM", "suggested_agents": ["Analysis Agent", "Coordination Agent", "Execution Agent"]}',
    'Executing Task 3: Cross-Border Tax & Duty Reconciliation',
    true,
    94,
    NOW() - INTERVAL '3 hours',
    NOW()
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'Automated Disaster Recovery & Failover Verification',
    'Scheduled zero-downtime database replication audit, warm standby promotion test, and failback verification.',
    'IT Operations',
    NOW() + INTERVAL '5 days',
    'Infrastructure',
    'CRITICAL',
    'CRITICAL',
    'ready',
    '00000000-0000-0000-0000-000000000001',
    '{"summary": "Mission critical infrastructure verification workflow.", "risk_level": "HIGH", "suggested_agents": ["Planning Agent", "Monitoring Agent", "Replanning Agent"]}',
    'Pre-flight automated dependency checks complete',
    false,
    98,
    NOW() - INTERVAL '1 day',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Tasks
INSERT INTO tasks (
  id,
  workflow_id,
  title,
  description,
  assigned_agent,
  priority,
  status,
  dependencies,
  requires_approval,
  deadline,
  estimated_duration,
  created_at
)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Validate Inventory Across Global Logistics Hubs',
    'Query multi-region warehouse databases to confirm SKU availability and warehouse allocation.',
    'Execution Agent',
    'HIGH',
    'completed',
    '[]'::jsonb,
    false,
    NOW() - INTERVAL '2 hours',
    15,
    NOW() - INTERVAL '3 hours'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Execute Primary Banking Clearing Batch',
    'Trigger automated SWIFT / ACH corporate transfer via integrated banking gateway API.',
    'Execution Agent',
    'CRITICAL',
    'completed',
    '["b0000000-0000-0000-0000-000000000001"]'::jsonb,
    false,
    NOW() - INTERVAL '1 hour',
    30,
    NOW() - INTERVAL '3 hours'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Reconcile VAT & Tariff Customs Exemption Codes',
    'Perform OCR matching on import documentation and verify tax exemptions against trade regulations.',
    'Coordination Agent',
    'HIGH',
    'in_progress',
    '["b0000000-0000-0000-0000-000000000002"]'::jsonb,
    true,
    NOW() + INTERVAL '1 hour',
    45,
    NOW() - INTERVAL '3 hours'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Dispatch Final EDI Manifest to Freight Carrier',
    'Generate EDI-214 carrier notification and notify supply chain partners.',
    'Execution Agent',
    'MEDIUM',
    'pending',
    '["b0000000-0000-0000-0000-000000000003"]'::jsonb,
    false,
    NOW() + INTERVAL '4 hours',
    20,
    NOW() - INTERVAL '3 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Agent Logs
INSERT INTO agent_logs (
  workflow_id,
  agent_name,
  action,
  status,
  summary,
  confidence,
  timestamp
)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'Orchestrator',
    'Workflow Decomposed and Assigned',
    'completed',
    'Successfully mapped 4 discrete pipeline tasks to domain agents.',
    0.985,
    NOW() - INTERVAL '170 minutes'
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'Execution Agent',
    'Inventory Verification Executed',
    'completed',
    '1,450 units verified across EU & US logistics nodes.',
    0.990,
    NOW() - INTERVAL '110 minutes'
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'Coordination Agent',
    'Human-in-the-Loop Approval Dispatched',
    'active',
    'Awaiting managerial approval for $45,000 threshold transaction.',
    0.962,
    NOW() - INTERVAL '20 minutes'
  );

-- Seed Approvals
INSERT INTO approvals (
  id,
  workflow_id,
  task_id,
  action,
  reason,
  ai_recommendation,
  risk_level,
  status,
  created_at
)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000003',
    'Customs Clearance & High-Value Settlement Authorization',
    'Total invoice settlement exceeds $25,000 governance threshold ($45,000 recorded).',
    'AI recommends APPROVE. Historical vendor reliability is 99.4% and matched against signed contract.',
    'MEDIUM',
    'pending',
    NOW() - INTERVAL '25 minutes'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Notifications
INSERT INTO notifications (
  user_id,
  message,
  type,
  read,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Action Required: Approval pending for Cross-Border Invoice Settlement.',
    'approval',
    false,
    NOW() - INTERVAL '25 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Disaster Recovery verification workflow successfully scheduled.',
    'info',
    true,
    NOW() - INTERVAL '1 day'
  );
