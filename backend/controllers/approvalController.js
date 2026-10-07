const supabase = require('../config/supabase');
const { logAgentActivity } = require('../agents/executionAgent');
const { logWorkflowEvent } = require('../services/orchestratorService');
const { generateJSON } = require('../services/aiService');

// GET /api/approvals
const getApprovals = async (req, res, next) => {
  try {
    const { status } = req.query;

    const { data: userWorkflows } = await supabase.from('workflows').select('id, title')
      .eq('created_by', req.user.id);
    const wfIds = (userWorkflows || []).map(w => w.id);

    if (wfIds.length === 0) {
      return res.json({ approvals: [], data: [] });
    }

    let query = supabase.from('approvals').select('*')
      .in('workflow_id', wfIds)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ approvals: data || [], data: data || [] });
  } catch (error) { next(error); }
};

// POST /api/approvals/:id/approve
const approveAction = async (req, res, next) => {
  try {
    const { data: approval } = await supabase.from('approvals')
      .select('*')
      .eq('id', req.params.id).single();

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }
    if (approval.status !== 'pending') {
      return res.status(400).json({ error: 'Approval already processed' });
    }

    const { data, error } = await supabase.from('approvals').update({
      status: 'approved',
      approved_by: req.user.id,
      updated_at: new Date().toISOString(),
    }).eq('id', req.params.id).select().single();

    if (error) throw error;

    // If associated task, mark it in_progress
    if (approval.task_id) {
      await supabase.from('tasks').update({
        status: 'in_progress', updated_at: new Date().toISOString()
      }).eq('id', approval.task_id);
    }

    // Check if workflow was awaiting approval - resume
    const { data: workflow } = await supabase.from('workflows').select('*')
      .eq('id', approval.workflow_id).single();
    if (workflow?.status === 'awaiting_approval') {
      await supabase.from('workflows').update({
        status: 'executing', updated_at: new Date().toISOString()
      }).eq('id', approval.workflow_id);
    }

    await logAgentActivity(approval.workflow_id, 'Orchestrator', `Approval granted: ${approval.action}`, 'completed',
      `Human approval received from ${req.user.name}. Action approved. Workflow resuming.`, 1.0);

    await logWorkflowEvent(approval.workflow_id, 'APPROVAL_GRANTED', 'User', req.user.name,
      `Approval granted for: "${approval.action}" by ${req.user.name}. Workflow continuing.`);

    res.json({ approval: data, message: 'Action approved. Workflow continuing.' });
  } catch (error) { next(error); }
};

// POST /api/approvals/:id/reject
const rejectAction = async (req, res, next) => {
  try {
    const reasonGiven = req.body.reason || req.body.notes || 'No reason provided';
    const { data: approval } = await supabase.from('approvals')
      .select('*')
      .eq('id', req.params.id).single();

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }
    if (approval.status !== 'pending') {
      return res.status(400).json({ error: 'Approval already processed' });
    }

    const { data, error } = await supabase.from('approvals').update({
      status: 'rejected',
      approved_by: req.user.id,
      reason: reasonGiven,
      updated_at: new Date().toISOString(),
    }).eq('id', req.params.id).select().single();

    if (error) throw error;

    // Generate AI alternative recommendation
    let alternative = 'Consider escalating to a senior manager for review.';
    try {
      const aiResult = await generateJSON(`You are WorkFlowX AI. A human rejected the following action: "${approval.action}". 
      Reason given: "${reasonGiven}". 
      Generate a brief alternative recommendation in JSON: {"alternative": "brief alternative action", "reasoning": "why this is better"}`);
      alternative = aiResult.alternative || alternative;
    } catch (e) { /* use default */ }

    await logAgentActivity(approval.workflow_id, 'Orchestrator', `Approval rejected: ${approval.action}`, 'warning',
      `Action rejected by ${req.user.name}. AI generating alternative recommendation.`, 0.7);

    await logWorkflowEvent(approval.workflow_id, 'APPROVAL_REJECTED', 'User', req.user.name,
      `Approval rejected for: "${approval.action}". AI alternative: ${alternative}`);

    res.json({ approval: data, alternative, message: 'Action rejected. AI generating alternative.' });
  } catch (error) { next(error); }
};

module.exports = { getApprovals, approveAction, rejectAction };
