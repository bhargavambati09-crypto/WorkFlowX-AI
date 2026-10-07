/**
 * WorkFlowX AI - Backend System Constants & Enums
 * Segregated constants for agents, workflows, tasks, and governance
 */

const AGENT_NAMES = {
  ORCHESTRATOR: 'Orchestrator',
  ANALYSIS: 'Analysis Agent',
  PLANNING: 'Task Planning Agent',
  COORDINATION: 'Coordination Agent',
  EXECUTION: 'Execution Agent',
  MONITORING: 'Monitoring Agent',
  REPLANNING: 'Replanning Agent',
};

const WORKFLOW_STATUSES = {
  DRAFT: 'draft',
  ANALYZING: 'analyzing',
  PLANNING: 'planning',
  READY: 'ready',
  EXECUTING: 'executing',
  MONITORING: 'monitoring',
  BLOCKED: 'blocked',
  REPLANNING: 'replanning',
  AWAITING_APPROVAL: 'awaiting_approval',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

const TASK_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

const DEPARTMENTS = [
  'Billing & Fulfillment',
  'IT Operations',
  'Customer Support',
  'Supply Chain',
  'Finance',
  'Human Resources',
  'Legal & Compliance',
  'Engineering',
  'Operations',
];

const DEFAULT_CONFIDENCE_THRESHOLD = 0.75;

module.exports = {
  AGENT_NAMES,
  WORKFLOW_STATUSES,
  TASK_STATUSES,
  PRIORITIES,
  DEPARTMENTS,
  DEFAULT_CONFIDENCE_THRESHOLD,
};
