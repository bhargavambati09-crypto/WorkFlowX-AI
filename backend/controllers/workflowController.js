const supabase = require('../config/supabase');
const { workflowSchema, workflowUpdateSchema, askWorkflowSchema } = require('../validators/schemas');
const { orchestrateAnalysis, orchestrateExecution, orchestrateFailureSimulation, askWorkflow, updateWorkflowHealth, logWorkflowEvent } = require('../services/orchestratorService');
const { logAgentActivity } = require('../agents/executionAgent');

// GET /api/workflows
const getWorkflows = async (req, res, next) => {
  try {
    const { status, priority, limit = 20, offset = 0 } = req.query;
    let query = supabase.from('workflows').select('*').eq('created_by', req.user.id)
      .order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ workflows: data || [], data: data || [] });
  } catch (error) { next(error); }
};

// POST /api/workflows
const createWorkflow = async (req, res, next) => {
  try {
    const { title, description, department, deadline } = workflowSchema.parse(req.body);

    const { data, error } = await supabase.from('workflows').insert({
      title, description, department: department || 'General',
      deadline: deadline || null, status: 'draft', priority: 'MEDIUM',
      created_by: req.user.id, health_score: 100,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    await logWorkflowEvent(data.id, 'WORKFLOW_CREATED', 'User', req.user.name,
      `Workflow "${title}" created by ${req.user.name}`);

    res.status(201).json({ workflow: data, data, message: 'Workflow created successfully' });
  } catch (error) { next(error); }
};

// GET /api/workflows/:id
const getWorkflow = async (req, res, next) => {
  try {
    const { data: workflow, error } = await supabase.from('workflows').select('*')
      .eq('id', req.params.id).eq('created_by', req.user.id).single();
    if (error || !workflow) return res.status(404).json({ error: 'Workflow not found' });

    const { data: tasks } = await supabase.from('tasks').select('*')
      .eq('workflow_id', req.params.id).order('task_order', { ascending: true });
    const { data: logs } = await supabase.from('agent_logs').select('*')
      .eq('workflow_id', req.params.id).order('timestamp', { ascending: false });
    const { data: approvals } = await supabase.from('approvals').select('*')
      .eq('workflow_id', req.params.id).order('created_at', { ascending: false });

    workflow.tasks = tasks || [];
    workflow.logs = logs || [];
    workflow.approvals = approvals || [];

    res.json({ workflow, data: workflow });
  } catch (error) { next(error); }
};

// PUT /api/workflows/:id
const updateWorkflow = async (req, res, next) => {
  try {
    const updates = workflowUpdateSchema.parse(req.body);
    const { data: existing } = await supabase.from('workflows').select('id')
      .eq('id', req.params.id).eq('created_by', req.user.id).single();
    if (!existing) return res.status(404).json({ error: 'Workflow not found' });

    const { data, error } = await supabase.from('workflows')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ workflow: data, data });
  } catch (error) { next(error); }
};

// DELETE /api/workflows/:id
const deleteWorkflow = async (req, res, next) => {
  try {
    const { data: existing } = await supabase.from('workflows').select('id')
      .eq('id', req.params.id).eq('created_by', req.user.id).single();
    if (!existing) return res.status(404).json({ error: 'Workflow not found' });
    await supabase.from('workflows').delete().eq('id', req.params.id);
    res.json({ message: 'Workflow deleted' });
  } catch (error) { next(error); }
};

// POST /api/workflows/:id/analyze
const analyzeWorkflow = async (req, res, next) => {
  try {
    const { data: workflow } = await supabase.from('workflows').select('*')
      .eq('id', req.params.id).eq('created_by', req.user.id).single();
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const result = await orchestrateAnalysis(req.params.id, req.user.id);
    res.json({ message: 'Analysis and planning complete', ...result });
  } catch (error) { next(error); }
};

// POST /api/workflows/:id/start
const startWorkflow = async (req, res, next) => {
  try {
    const { data: workflow } = await supabase.from('workflows').select('*')
      .eq('id', req.params.id).eq('created_by', req.user.id).single();
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const result = await orchestrateExecution(req.params.id, req.user.id);
    res.json({ message: 'Workflow execution started', ...result });
  } catch (error) { next(error); }
};

// POST /api/workflows/:id/simulate-failure
const simulateFailure = async (req, res, next) => {
  try {
    const { data: workflow } = await supabase.from('workflows').select('*')
      .eq('id', req.params.id).eq('created_by', req.user.id).single();
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const result = await orchestrateFailureSimulation(req.params.id, req.user.id);
    res.json({ message: 'Failure simulation complete. Replanning executed.', ...result });
  } catch (error) { next(error); }
};

// POST /api/workflows/:id/replan
const replanWorkflow = async (req, res, next) => {
  try {
    const result = await orchestrateFailureSimulation(req.params.id, req.user.id);
    res.json({ message: 'Replanning complete', ...result });
  } catch (error) { next(error); }
};

// GET /api/workflows/:id/agents
const getWorkflowAgents = async (req, res, next) => {
  try {
    const { data } = await supabase.from('agent_logs').select('*')
      .eq('workflow_id', req.params.id).order('timestamp', { ascending: false }).limit(50);
    
    // Group by agent name for latest status
    const agentMap = {};
    (data || []).forEach(log => {
      if (!agentMap[log.agent_name]) {
        agentMap[log.agent_name] = log;
      }
    });

    const agents = [
      'Orchestrator', 'Analysis Agent', 'Task Planning Agent',
      'Coordination Agent', 'Execution Agent', 'Monitoring Agent', 'Replanning Agent'
    ].map(name => ({
      name,
      status: agentMap[name]?.status || 'idle',
      currentAction: agentMap[name]?.action || 'Waiting for workflow',
      lastActivity: agentMap[name]?.summary || 'No activity yet',
      timestamp: agentMap[name]?.timestamp || null,
      confidence: agentMap[name]?.confidence || null,
    }));

    res.json({ agents, logs: data });
  } catch (error) { next(error); }
};

// GET /api/workflows/:id/events
const getWorkflowEvents = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('workflow_events').select('*')
      .eq('workflow_id', req.params.id).order('created_at', { ascending: false }).limit(30);
    if (error) throw error;
    res.json({ events: data });
  } catch (error) { next(error); }
};

// GET /api/workflows/:id/health
const getWorkflowHealth = async (req, res, next) => {
  try {
    const healthScore = await updateWorkflowHealth(req.params.id);
    const { data: tasks } = await supabase.from('tasks').select('*').eq('workflow_id', req.params.id);
    res.json({
      healthScore,
      taskStats: {
        total: tasks?.length || 0,
        completed: tasks?.filter(t => t.status === 'completed').length || 0,
        failed: tasks?.filter(t => t.status === 'failed').length || 0,
        blocked: tasks?.filter(t => t.status === 'blocked').length || 0,
        inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
        pending: tasks?.filter(t => t.status === 'pending').length || 0,
      }
    });
  } catch (error) { next(error); }
};

// POST /api/workflows/:id/ask
const askWorkflowQuestion = async (req, res, next) => {
  try {
    const { question } = askWorkflowSchema.parse(req.body);
    const result = await askWorkflow(req.params.id, question, req.user.id);
    res.json({ ...result, data: result?.answer || result });
  } catch (error) { next(error); }
};

// POST /api/workflows/:id/complete
const completeWorkflow = async (req, res, next) => {
  try {
    const { data: workflow } = await supabase.from('workflows').select('*')
      .eq('id', req.params.id).eq('created_by', req.user.id).single();
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    // Mark all remaining tasks as completed
    await supabase.from('tasks').update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('workflow_id', req.params.id).in('status', ['pending', 'in_progress', 'blocked']);

    await supabase.from('workflows').update({
      status: 'completed', health_score: 100,
      current_step: 'Workflow completed successfully',
      updated_at: new Date().toISOString(),
    }).eq('id', req.params.id);

    await logAgentActivity(req.params.id, 'Orchestrator', 'Workflow completed', 'completed',
      `Workflow "${workflow.title}" has been successfully completed.`, 1.0);

    await logWorkflowEvent(req.params.id, 'WORKFLOW_COMPLETED', 'User', req.user.name,
      `Workflow "${workflow.title}" marked as completed by ${req.user.name}`);

    const { data: updated } = await supabase.from('workflows').select('*').eq('id', req.params.id).single();
    res.json({ message: 'Workflow completed', workflow: updated });
  } catch (error) { next(error); }
};

// POST /api/workflows/demo - Create demo workflow
const createDemoWorkflow = async (req, res, next) => {
  try {
    const demoWorkflows = [
      {
        title: 'Customer Payment Issue - Order Not Created',
        description: 'A customer was charged for an order, but the order was not created in our system. The payment of ₹4,500 was successfully debited from the customer\'s account (Transaction ID: TXN-2024-78923) but no order confirmation was generated. The customer has complained and is requesting either order fulfillment or a full refund. This is causing significant customer dissatisfaction and potential revenue impact.',
        department: 'Finance & Customer Support',
      },
      {
        title: 'IT System Outage - Production Server Down',
        description: 'The main production server is experiencing intermittent downtime affecting approximately 500 active users. The system has been down for 45 minutes and is causing loss of business operations. The DevOps team needs to identify root cause, implement fixes, and restore full service. SLA breach imminent.',
        department: 'IT Operations',
      },
      {
        title: 'Delayed Delivery - Supplier Logistics Issue',
        description: 'A critical shipment of raw materials from Supplier ABC (Order #SUP-2024-5678) is delayed by 3 days due to logistics issues. This delay will impact production schedule and may cause a 2-week delay in product delivery to 15 enterprise customers. Immediate coordination with logistics, supplier, and customers is needed.',
        department: 'Supply Chain',
      },
    ];

    const demo = demoWorkflows[0]; // Use the payment issue as main demo
    
    const { data, error } = await supabase.from('workflows').insert({
      title: demo.title,
      description: demo.description,
      department: demo.department,
      status: 'draft',
      priority: 'HIGH',
      created_by: req.user.id,
      health_score: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    await logWorkflowEvent(data.id, 'DEMO_WORKFLOW_CREATED', 'System', 'Demo Mode',
      `Demo workflow created: "${demo.title}"`);

    // Auto-trigger analysis
    const result = await orchestrateAnalysis(data.id, req.user.id);
    
    res.status(201).json({
      message: 'Demo workflow created and analyzed successfully',
      workflow: result.workflow,
      data: result.workflow,
      analysis: result.analysis,
      tasks: result.tasks,
    });
  } catch (error) { next(error); }
};

module.exports = {
  getWorkflows, createWorkflow, getWorkflow, updateWorkflow, deleteWorkflow,
  analyzeWorkflow, startWorkflow, simulateFailure, replanWorkflow,
  getWorkflowAgents, getWorkflowEvents, getWorkflowHealth,
  askWorkflowQuestion, completeWorkflow, createDemoWorkflow,
};
