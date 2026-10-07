const supabase = require('../config/supabase');

// GET /api/analytics/dashboard
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all workflows for user
    const { data: workflows } = await supabase.from('workflows').select('*').eq('created_by', userId);
    
    // Get all tasks for user's workflows
    const workflowIds = (workflows || []).map(w => w.id);
    const { data: tasks } = workflowIds.length > 0
      ? await supabase.from('tasks').select('*').in('workflow_id', workflowIds)
      : { data: [] };

    // Get agent logs
    const { data: agentLogs } = workflowIds.length > 0
      ? await supabase.from('agent_logs').select('*').in('workflow_id', workflowIds)
        .order('timestamp', { ascending: false }).limit(20)
      : { data: [] };

    // Get replan events
    const { data: replanEvents } = workflowIds.length > 0
      ? await supabase.from('workflow_events').select('*').in('workflow_id', workflowIds)
        .eq('event_type', 'REPLAN_COMPLETE')
      : { data: [] };

    const wf = workflows || [];
    const tk = tasks || [];

    const stats = {
      totalWorkflows: wf.length,
      activeWorkflows: wf.filter(w => ['executing', 'monitoring', 'analyzing', 'planning', 'replanning'].includes(w.status)).length,
      completedWorkflows: wf.filter(w => w.status === 'completed').length,
      failedWorkflows: wf.filter(w => w.status === 'failed').length,
      draftWorkflows: wf.filter(w => w.status === 'draft').length,
      awaitingApproval: wf.filter(w => w.status === 'awaiting_approval').length,
      
      totalTasks: tk.length,
      pendingTasks: tk.filter(t => t.status === 'pending').length,
      inProgressTasks: tk.filter(t => t.status === 'in_progress').length,
      completedTasks: tk.filter(t => t.status === 'completed').length,
      failedTasks: tk.filter(t => t.status === 'failed').length,
      blockedTasks: tk.filter(t => t.status === 'blocked').length,
      
      highPriorityWorkflows: wf.filter(w => w.priority === 'HIGH' || w.priority === 'CRITICAL').length,
      replannedWorkflows: replanEvents?.length || 0,
      
      averageHealthScore: wf.length > 0 ? Math.round(wf.reduce((sum, w) => sum + (w.health_score || 100), 0) / wf.length) : 100,
    };

    // Workflow status distribution for charts
    const statusDistribution = {
      draft: stats.draftWorkflows,
      active: stats.activeWorkflows,
      completed: stats.completedWorkflows,
      failed: stats.failedWorkflows,
    };

    // Agent activity distribution
    const agentActivity = {};
    (agentLogs || []).forEach(log => {
      agentActivity[log.agent_name] = (agentActivity[log.agent_name] || 0) + 1;
    });

    // Priority distribution
    const priorityDistribution = {
      CRITICAL: wf.filter(w => w.priority === 'CRITICAL').length,
      HIGH: wf.filter(w => w.priority === 'HIGH').length,
      MEDIUM: wf.filter(w => w.priority === 'MEDIUM').length,
      LOW: wf.filter(w => w.priority === 'LOW').length,
    };

    // Recent workflows
    const recentWorkflows = wf.slice(0, 5);

    // Recent agent activity
    const recentAgentActivity = (agentLogs || []).slice(0, 10);

    res.json({
      stats,
      statusDistribution,
      agentActivity,
      priorityDistribution,
      recentWorkflows,
      recentAgentActivity,
    });
  } catch (error) { next(error); }
};

module.exports = { getDashboardAnalytics };
