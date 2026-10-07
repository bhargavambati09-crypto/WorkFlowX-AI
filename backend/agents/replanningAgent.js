const { generateJSON } = require('../services/aiService');
const { logAgentActivity } = require('./executionAgent');

/**
 * Replanning Agent - Generates alternative plans when tasks fail or are blocked
 */
const replanningAgent = async (workflow, failedTask, allTasks, analysis) => {
  await logAgentActivity(workflow.id, 'Replanning Agent', `Analyzing failure: ${failedTask.title}`, 'active',
    `Task "${failedTask.title}" assigned to ${failedTask.assigned_agent} has failed. Generating alternative plan.`, 0.91);

  const pendingTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'blocked');
  const completedTasks = allTasks.filter(t => t.status === 'completed');

  const prompt = `You are the Replanning Agent of WorkFlowX AI. A task has failed and you must generate an intelligent recovery plan.

WORKFLOW CONTEXT:
Title: ${workflow.title}
Description: ${workflow.description}
Original Priority: ${workflow.priority}
Current Status: ${workflow.status}

FAILED TASK:
Title: ${failedTask.title}
Description: ${failedTask.description}
Assigned Agent: ${failedTask.assigned_agent}
Priority: ${failedTask.priority}

COMPLETED TASKS:
${completedTasks.map(t => `- ${t.title} (by ${t.assigned_agent})`).join('\n') || 'None yet'}

REMAINING PENDING TASKS:
${pendingTasks.map(t => `- ${t.title} (assigned to ${t.assigned_agent})`).join('\n') || 'None remaining'}

AVAILABLE BACKUP AGENTS:
- Finance Agent / Backup Finance Agent
- Technical Agent / Backup Technical Agent  
- Support Agent / Escalated Support Agent
- Operations Agent / Senior Operations Agent
- Manager Agent (escalation)

You MUST return a JSON object with EXACTLY this structure:
{
  "reason": "Detailed explanation of why the original task failed and the approach taken",
  "failedTask": "${failedTask.title}",
  "failureAnalysis": "Root cause analysis of the failure",
  "recoveryStrategy": "The overall recovery strategy being employed",
  "newPlan": [
    {
      "title": "Task title",
      "description": "What this task does and why",
      "priority": "HIGH",
      "assignedAgent": "Backup Finance Agent",
      "isReplacement": true,
      "replaces": "${failedTask.title}",
      "estimatedDuration": 30,
      "requiresApproval": false,
      "approvalReason": ""
    }
  ],
  "escalationRequired": false,
  "escalationReason": "",
  "requiresHumanApproval": false,
  "humanApprovalReason": "",
  "riskAssessment": "Assessment of risk after replanning",
  "preventionRecommendations": ["recommendations to prevent similar failures"]
}

REPLANNING RULES:
1. Always reassign the failed task to a backup/alternative agent
2. If the task is financial/high-risk, add a manager review step
3. If escalation is needed (e.g., system is down, no backup available), set escalationRequired: true
4. Consider whether human approval should be requested
5. Add additional verification tasks if the failure had cascading impacts
6. Keep existing completed tasks - only replan what's needed
7. Be specific about WHY you're making each replanning decision`;

  try {
    const result = await generateJSON(prompt);
    
    const newPlan = (result.newPlan || []).map(task => ({
      title: task.title || 'Recovery Task',
      description: task.description || 'Recovery task from replanning',
      priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(task.priority) ? task.priority : 'HIGH',
      assignedAgent: task.assignedAgent || 'Manager Agent',
      isReplacement: Boolean(task.isReplacement),
      replaces: task.replaces || failedTask.title,
      estimatedDuration: typeof task.estimatedDuration === 'number' ? task.estimatedDuration : 30,
      requiresApproval: Boolean(task.requiresApproval),
      approvalReason: task.approvalReason || '',
    }));

    await logAgentActivity(workflow.id, 'Replanning Agent', 'Recovery plan generated', 'completed',
      `New plan created: ${newPlan.length} recovery tasks. Strategy: ${result.recoveryStrategy?.substring(0, 100)}`, 0.89);

    return {
      reason: result.reason || 'Task failure detected, alternative plan generated',
      failedTask: result.failedTask || failedTask.title,
      failureAnalysis: result.failureAnalysis || 'Task could not be completed by the assigned agent',
      recoveryStrategy: result.recoveryStrategy || 'Reassign to backup agent',
      newPlan,
      escalationRequired: Boolean(result.escalationRequired),
      escalationReason: result.escalationReason || '',
      requiresHumanApproval: Boolean(result.requiresHumanApproval),
      humanApprovalReason: result.humanApprovalReason || '',
      riskAssessment: result.riskAssessment || 'Moderate risk, recovery plan in place',
      preventionRecommendations: Array.isArray(result.preventionRecommendations) 
        ? result.preventionRecommendations 
        : ['Review agent assignment logic', 'Add redundancy'],
    };
  } catch (error) {
    console.error('Replanning Agent error:', error.message);
    
    // Fallback replan
    const backupAgents = {
      'Finance Agent': 'Backup Finance Agent',
      'Technical Agent': 'Senior Technical Agent',
      'Support Agent': 'Escalated Support Agent',
      'Operations Agent': 'Senior Operations Agent',
      'Manager Agent': 'Executive Manager',
    };
    
    const backupAgent = backupAgents[failedTask.assigned_agent] || 'Manager Agent';
    
    return {
      reason: `${failedTask.assigned_agent} was unable to complete task "${failedTask.title}". Reassigning to ${backupAgent} and adding manager oversight.`,
      failedTask: failedTask.title,
      failureAnalysis: 'Agent failure - original agent unavailable or unable to complete task',
      recoveryStrategy: `Reassign to ${backupAgent} with manager oversight`,
      newPlan: [
        {
          title: `[RECOVERY] ${failedTask.title}`,
          description: `Recovery task: ${failedTask.description} - Reassigned from ${failedTask.assigned_agent} to ${backupAgent} after failure.`,
          priority: failedTask.priority || 'HIGH',
          assignedAgent: backupAgent,
          isReplacement: true,
          replaces: failedTask.title,
          estimatedDuration: 45,
          requiresApproval: true,
          approvalReason: 'Recovery task requires manager approval due to prior failure',
        },
        {
          title: 'Manager Review and Oversight',
          description: 'Manager to review recovery progress and ensure successful completion',
          priority: 'HIGH',
          assignedAgent: 'Manager Agent',
          isReplacement: false,
          replaces: '',
          estimatedDuration: 20,
          requiresApproval: false,
          approvalReason: '',
        },
      ],
      escalationRequired: false,
      escalationReason: '',
      requiresHumanApproval: true,
      humanApprovalReason: 'Recovery from task failure requires human oversight',
      riskAssessment: 'Moderate risk - backup agent assigned, additional verification added',
      preventionRecommendations: ['Implement agent health checks', 'Add task retry logic'],
    };
  }
};

module.exports = replanningAgent;
