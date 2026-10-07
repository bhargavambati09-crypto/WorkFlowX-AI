const { Workflow, Task, AgentLog, Approval, WorkflowEvent, Notification } = require('../models');
const supabase = require('../config/supabase');

/**
 * Workflow Service
 * Core business logic and persistence coordination for WorkFlowX AI workflows
 */
class WorkflowService {
  /**
   * Get all workflows for a user with optional filters
   */
  static async listUserWorkflows(userId, filters = {}) {
    return await Workflow.findByUser(userId, filters);
  }

  /**
   * Get complete workflow aggregated with its tasks, agent logs, approvals, and events
   */
  static async getWorkflowDetails(workflowId, userId = null) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) return null;

    // Optional user authorization check
    if (userId && workflow.created_by !== userId) {
      const err = new Error('Unauthorized workflow access');
      err.status = 403;
      throw err;
    }

    const [tasks, agentLogs, approvals, events] = await Promise.all([
      Task.findByWorkflow(workflowId),
      AgentLog.findByWorkflow(workflowId, { limit: 50 }),
      Approval.findByWorkflow(workflowId),
      WorkflowEvent.findByWorkflow(workflowId, { limit: 50 }),
    ]);

    return {
      ...workflow,
      tasks,
      agent_logs: agentLogs,
      approvals,
      events,
    };
  }

  /**
   * Create a new workflow record
   */
  static async createWorkflow(payload, userId) {
    const newWorkflow = await Workflow.create({
      ...payload,
      createdBy: userId,
      status: payload.status || 'draft',
      healthScore: 100,
    });

    await WorkflowEvent.create({
      workflowId: newWorkflow.id,
      eventType: 'WORKFLOW_CREATED',
      actorType: 'User',
      actorName: 'Operator',
      message: `Workflow created: "${newWorkflow.title}"`,
      metadata: { department: newWorkflow.department, priority: newWorkflow.priority },
    });

    return newWorkflow;
  }

  /**
   * Update workflow attributes
   */
  static async updateWorkflow(workflowId, updates, userId = null) {
    const existing = await Workflow.findById(workflowId);
    if (!existing) return null;

    if (userId && existing.created_by !== userId) {
      const err = new Error('Unauthorized workflow update');
      err.status = 403;
      throw err;
    }

    const updated = await Workflow.update(workflowId, updates);
    return updated;
  }

  /**
   * Delete a workflow and associated cascades
   */
  static async deleteWorkflow(workflowId, userId = null) {
    const existing = await Workflow.findById(workflowId);
    if (!existing) return null;

    if (userId && existing.created_by !== userId) {
      const err = new Error('Unauthorized workflow deletion');
      err.status = 403;
      throw err;
    }

    return await Workflow.delete(workflowId);
  }

  /**
   * Calculate and persist dynamic workflow health score (0-100)
   */
  static async recalculateHealthScore(workflowId) {
    const tasks = await Task.findByWorkflow(workflowId);
    const { data: replans } = await supabase
      .from('workflow_events')
      .select('id')
      .eq('workflow_id', workflowId)
      .eq('event_type', 'REPLAN_COMPLETE');

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const replanCount = replans?.length || 0;

    let score = total > 0 ? Math.round((completed / total) * 60) + 40 : 100;
    score -= failed * 15;
    score -= blocked * 8;
    score -= replanCount * 5;
    score = Math.min(100, Math.max(0, score));

    await Workflow.update(workflowId, { healthScore: score });
    return score;
  }

  /**
   * Mark workflow as fully completed
   */
  static async completeWorkflow(workflowId, userId) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const updated = await Workflow.update(workflowId, {
      status: 'completed',
      healthScore: 100,
      currentStep: 'Workflow completed successfully',
    });

    await WorkflowEvent.create({
      workflowId,
      eventType: 'WORKFLOW_COMPLETED',
      actorType: 'System',
      actorName: 'Orchestrator',
      message: `Workflow "${workflow.title}" marked as completed.`,
    });

    return updated;
  }
}

module.exports = WorkflowService;
