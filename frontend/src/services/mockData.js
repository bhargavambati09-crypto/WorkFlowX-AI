// Resilient fallback mock data for standalone preview & offline demos
export const DEMO_WORKFLOW = {
  id: '00000000-0000-0000-0000-000000000002',
  title: 'Customer Payment Succeeded - Order Generation Delayed',
  description: 'Customer was billed $129.00 on Stripe (txn_89410). Payment succeeded, but the downstream order creation queue timed out. The customer submitted an urgent complaint.',
  department: 'Billing & Fulfillment',
  status: 'executing',
  priority: 'HIGH',
  business_impact: 'High customer churn risk & potential payment dispute',
  health_score: 92,
  created_at: new Date(Date.now() - 3600000).toISOString(),
  ai_analysis: {
    summary: 'Payment transaction was charged successfully, but downstream order record was not generated due to an asynchronous timeout.',
    category: 'Billing & Fulfillment',
    priority: 'HIGH',
    confidence: 0.96,
    recommendations: [
      'Verify Stripe charge transaction ID',
      'Inspect database transaction logs for uncommitted order items',
      'Execute customer refund or manual order recreation based on stock'
    ],
    replanHistory: [
      {
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        failedTask: 'Simulate Warehouse Stock & Order Dispatch',
        reason: 'Execution Agent was unable to complete task "Simulate Warehouse Stock & Order Dispatch". Reassigning to Manager Agent and adding manager oversight.',
        recoveryStrategy: 'Reassign to Manager Agent with manager oversight'
      }
    ]
  },
  tasks: [
    {
      id: 'task-1',
      title: 'Verify Payment Gateway Transaction',
      description: 'Check Stripe logs for charge status and customer transaction identifier.',
      status: 'completed',
      priority: 'HIGH',
      assigned_agent: 'Analysis Agent',
      task_order: 1,
      retry_count: 0,
      requires_approval: false
    },
    {
      id: 'task-2',
      title: 'Query Uncommitted Order Ledger',
      description: 'Search database inventory logs for abandoned checkout session.',
      status: 'completed',
      priority: 'HIGH',
      assigned_agent: 'Execution Agent',
      task_order: 2,
      retry_count: 0,
      requires_approval: false
    },
    {
      id: 'task-3',
      title: 'Reconcile Inventory & Dispatch Stock',
      description: 'Reserve inventory item #89410 and dispatch webhook to logistics warehouse.',
      status: 'in_progress',
      priority: 'MEDIUM',
      assigned_agent: 'Execution Agent',
      task_order: 3,
      retry_count: 1,
      requires_approval: false
    },
    {
      id: 'task-4',
      title: 'Customer Goodwill Compensation Credit',
      description: 'Authorize $20 goodwill store credit for resolution delay.',
      status: 'pending',
      priority: 'HIGH',
      assigned_agent: 'Finance Agent',
      task_order: 4,
      retry_count: 0,
      requires_approval: true
    },
    {
      id: 'task-5',
      title: 'Customer Email Notification',
      description: 'Send automated resolution notice with tracking number and credit details.',
      status: 'pending',
      priority: 'LOW',
      assigned_agent: 'Support Agent',
      task_order: 5,
      retry_count: 0,
      requires_approval: false
    }
  ],
  logs: [
    {
      id: 'log-1',
      agent_name: 'Orchestrator',
      action: 'Initialized multi-agent workflow state machine',
      status: 'completed',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'log-2',
      agent_name: 'Analysis Agent',
      action: 'Extracted problem entities and determined HIGH priority impact',
      status: 'completed',
      timestamp: new Date(Date.now() - 3500000).toISOString()
    },
    {
      id: 'log-3',
      agent_name: 'Task Planning Agent',
      action: 'Decomposed incident into 5 directed acyclic tasks',
      status: 'completed',
      timestamp: new Date(Date.now() - 3400000).toISOString()
    },
    {
      id: 'log-4',
      agent_name: 'Coordination Agent',
      action: 'Assigned tasks across specialized agents (Analysis, Execution, Finance, Support)',
      status: 'completed',
      timestamp: new Date(Date.now() - 3300000).toISOString()
    },
    {
      id: 'log-5',
      agent_name: 'Monitoring Agent',
      action: 'Active telemetry stream scanning for exceptions and latency',
      status: 'active',
      timestamp: new Date(Date.now() - 300000).toISOString()
    }
  ],
  approvals: [
    {
      id: 'app-1',
      action_type: 'Goodwill Credit Authorization',
      reason: 'Issuing $20 store credit exceeds autonomous agent limit ($15 max auto-grant).',
      impact_level: 'HIGH',
      status: 'pending',
      created_at: new Date(Date.now() - 1200000).toISOString()
    }
  ]
};

export const DEMO_STATS = {
  totalWorkflows: 8,
  activeWorkflows: 4,
  completedWorkflows: 3,
  failedTasks: 1,
  pendingTasks: 6,
  completedTasks: 19,
  totalTasks: 26,
  highPriorityWorkflows: 3,
  replannedWorkflows: 2,
  awaitingApproval: 1,
};
