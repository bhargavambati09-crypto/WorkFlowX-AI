const supabase = require('../config/supabase');
const { taskUpdateSchema } = require('../validators/schemas');
const { logAgentActivity } = require('../agents/executionAgent');
const { logWorkflowEvent } = require('../services/orchestratorService');

// GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const { workflow_id, status, assigned_agent } = req.query;
    
    // Fetch user workflows to filter tasks securely
    const { data: userWorkflows } = await supabase.from('workflows').select('id, title')
      .eq('created_by', req.user.id);
    const wfIds = (userWorkflows || []).map(w => w.id);

    if (wfIds.length === 0) {
      return res.json({ tasks: [], data: [] });
    }

    let query = supabase.from('tasks').select('*')
      .in('workflow_id', workflow_id ? [workflow_id] : wfIds)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (assigned_agent) query = query.eq('assigned_agent', assigned_agent);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ tasks: data || [], data: data || [] });
  } catch (error) { next(error); }
};

// GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    // Fetch user's workflow IDs first to enforce ownership (prevent IDOR)
    const { data: userWorkflows } = await supabase.from('workflows').select('id')
      .eq('created_by', req.user.id);
    const wfIds = (userWorkflows || []).map(w => w.id);

    const { data, error } = await supabase.from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .in('workflow_id', wfIds.length ? wfIds : [''])
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ task: data, data });
  } catch (error) { next(error); }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const updates = taskUpdateSchema.parse(req.body);

    // Enforce ownership: only fetch task if it belongs to the user's workflow (prevents IDOR)
    const { data: userWorkflows } = await supabase.from('workflows').select('id')
      .eq('created_by', req.user.id);
    const wfIds = (userWorkflows || []).map(w => w.id);

    const { data: existing } = await supabase.from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .in('workflow_id', wfIds.length ? wfIds : [''])
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { data, error } = await supabase.from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();

    if (error) throw error;

    // Log the update
    if (updates.status) {
      await logAgentActivity(existing.workflow_id, 'Execution Agent',
        `Task status updated: ${existing.title}`, updates.status,
        `Task "${existing.title}" status changed to ${updates.status} by user`, 0.85);

      await logWorkflowEvent(existing.workflow_id, 'TASK_STATUS_CHANGED', 'User', req.user.name,
        `Task "${existing.title}" status updated to ${updates.status}`);
    }

    res.json({ task: data, data });
  } catch (error) { next(error); }
};

module.exports = { getTasks, getTask, updateTask };
