const supabase = require('../config/supabase');
const { logAgentActivity } = require('./executionAgent');

/**
 * Monitoring Agent - Monitors workflow progress and detects issues
 */
const monitoringAgent = async (workflowId) => {
  await logAgentActivity(workflowId, 'Monitoring Agent', 'Running workflow health check', 'active',
    'Scanning all tasks for delays, failures, and blockers', 0.95);

  // Get all tasks for this workflow
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('workflow_id', workflowId);

  if (error) throw error;

  const issues = [];
  const now = new Date();

  for (const task of tasks) {
    // Check for failed tasks
    if (task.status === 'failed') {
      issues.push({
        type: 'TASK_FAILURE',
        taskId: task.id,
        taskTitle: task.title,
        severity: 'CRITICAL',
        message: `Task "${task.title}" has failed and requires replanning`,
        assignedAgent: task.assigned_agent,
      });
    }

    // Check for overdue tasks
    if (task.deadline && task.status !== 'completed' && task.status !== 'failed') {
      const deadline = new Date(task.deadline);
      if (deadline < now) {
        issues.push({
          type: 'TASK_OVERDUE',
          taskId: task.id,
          taskTitle: task.title,
          severity: 'HIGH',
          message: `Task "${task.title}" is overdue`,
          assignedAgent: task.assigned_agent,
        });
      }
    }

    // Check for blocked tasks
    if (task.status === 'blocked') {
      issues.push({
        type: 'TASK_BLOCKED',
        taskId: task.id,
        taskTitle: task.title,
        severity: 'MEDIUM',
        message: `Task "${task.title}" is blocked`,
        assignedAgent: task.assigned_agent,
      });
    }
  }

  // Calculate workflow health
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const failedTasks = tasks.filter(t => t.status === 'failed').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  const healthScore = calculateHealthScore(totalTasks, completedTasks, failedTasks, blockedTasks, issues.length);

  if (issues.length > 0) {
    await logAgentActivity(workflowId, 'Monitoring Agent', `Detected ${issues.length} issue(s)`, 'warning',
      `Found: ${issues.map(i => i.type).join(', ')}. Notifying Orchestrator for replanning.`, 0.97);
  } else {
    await logAgentActivity(workflowId, 'Monitoring Agent', 'Workflow health check complete', 'completed',
      `All tasks operating normally. Progress: ${completedTasks}/${totalTasks} tasks completed. Health: ${healthScore}/100`, 0.98);
  }

  return {
    issues,
    healthScore,
    stats: { totalTasks, completedTasks, failedTasks, blockedTasks, inProgressTasks },
  };
};

/**
 * Calculate workflow health score (0-100)
 */
const calculateHealthScore = (total, completed, failed, blocked, issueCount) => {
  if (total === 0) return 100;
  
  let score = 100;
  
  // Progress bonus
  const progressRatio = completed / total;
  score = Math.round(progressRatio * 60) + 40; // Base 40, up to 100 for full completion
  
  // Deductions
  score -= failed * 15;      // Each failed task: -15 points
  score -= blocked * 8;      // Each blocked task: -8 points
  score -= issueCount * 5;   // Each issue: -5 points
  
  return Math.min(100, Math.max(0, score));
};

module.exports = { monitoringAgent, calculateHealthScore };
