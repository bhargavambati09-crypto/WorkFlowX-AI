const { generateJSON } = require('../services/aiService');

/**
 * Task Planning Agent - Converts analysis into actionable tasks
 */
const planningAgent = async (analysis, workflowContext) => {
  const prompt = `You are the Task Planning Agent of WorkFlowX AI, an enterprise autonomous workflow intelligence system.

Your task is to create a detailed, actionable task plan based on the following analysis.

WORKFLOW CONTEXT:
Title: ${workflowContext.title}
Description: ${workflowContext.description}
Department: ${workflowContext.department || 'General'}
Priority: ${analysis.priority}
Category: ${analysis.category}
Affected Departments: ${(analysis.departments || []).join(', ')}

ANALYSIS SUMMARY:
${analysis.summary}

RECOMMENDED ACTIONS:
${(analysis.recommendedActions || []).map((a, i) => `${i + 1}. ${a}`).join('\n')}

AVAILABLE AGENTS:
- Finance Agent (handles payment, refund, financial verification tasks)
- Technical Agent (handles system issues, debugging, integrations, data)
- Support Agent (handles customer communication, ticket resolution, follow-up)
- Operations Agent (handles process coordination, logistics, operations)
- Manager Agent (handles escalations, approvals, high-impact decisions)
- Monitoring Agent (handles progress tracking, SLA monitoring, alerts)

You MUST return a JSON object with EXACTLY this structure:
{
  "planSummary": "Brief overview of the execution plan",
  "totalEstimatedTime": "e.g. '4-6 hours'",
  "tasks": [
    {
      "title": "Specific task title",
      "description": "Detailed description of what needs to be done and why",
      "priority": "HIGH",
      "assignedAgent": "Finance Agent",
      "agentReason": "Why this agent is best for this task",
      "dependencies": [],
      "requiresApproval": false,
      "approvalReason": "",
      "estimatedDuration": 30,
      "status": "pending",
      "sequence": 1
    }
  ],
  "criticalPath": ["task title 1", "task title 2"],
  "parallelizable": ["task title 3", "task title 4"],
  "escalationTriggers": ["condition that would trigger escalation"],
  "successCriteria": ["what defines resolution"]
}

IMPORTANT RULES:
1. Create 4-7 specific, actionable tasks (not generic ones)
2. Tasks should have logical dependencies (some can run in parallel)
3. High-value financial or irreversible actions MUST have requiresApproval: true
4. The first task should always start with verification/investigation
5. Include a final "resolution/closure" task
6. estimatedDuration is in minutes
7. Dependencies array should contain titles of tasks this task depends on
8. Make tasks specific to the actual problem described`;

  try {
    const result = await generateJSON(prompt);
    
    // Validate and process tasks
    const tasks = (result.tasks || []).map((task, index) => ({
      title: task.title || `Task ${index + 1}`,
      description: task.description || 'Task description',
      priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(task.priority) ? task.priority : analysis.priority,
      assignedAgent: task.assignedAgent || 'Operations Agent',
      agentReason: task.agentReason || 'Best suited for this task',
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      requiresApproval: Boolean(task.requiresApproval),
      approvalReason: task.approvalReason || '',
      estimatedDuration: typeof task.estimatedDuration === 'number' ? task.estimatedDuration : 30,
      status: 'pending',
      sequence: task.sequence || index + 1,
    }));

    return {
      planSummary: result.planSummary || 'Execution plan generated',
      totalEstimatedTime: result.totalEstimatedTime || '2-4 hours',
      tasks,
      criticalPath: Array.isArray(result.criticalPath) ? result.criticalPath : [],
      parallelizable: Array.isArray(result.parallelizable) ? result.parallelizable : [],
      escalationTriggers: Array.isArray(result.escalationTriggers) ? result.escalationTriggers : [],
      successCriteria: Array.isArray(result.successCriteria) ? result.successCriteria : [],
    };
  } catch (error) {
    console.error('Planning Agent error:', error.message);
    // Return fallback plan
    return {
      planSummary: 'Fallback plan generated due to AI planning error',
      totalEstimatedTime: '2-4 hours',
      tasks: [
        {
          title: 'Investigate and document the issue',
          description: `Thoroughly investigate the reported issue: ${workflowContext.description?.substring(0, 200)}`,
          priority: analysis.priority || 'HIGH',
          assignedAgent: 'Operations Agent',
          agentReason: 'Operations team handles initial investigations',
          dependencies: [],
          requiresApproval: false,
          approvalReason: '',
          estimatedDuration: 30,
          status: 'pending',
          sequence: 1,
        },
        {
          title: 'Assess impact and affected parties',
          description: 'Evaluate the full scope of impact on business operations and stakeholders',
          priority: analysis.priority || 'HIGH',
          assignedAgent: 'Manager Agent',
          agentReason: 'Management needs to assess business impact',
          dependencies: ['Investigate and document the issue'],
          requiresApproval: false,
          approvalReason: '',
          estimatedDuration: 20,
          status: 'pending',
          sequence: 2,
        },
        {
          title: 'Implement resolution and verify fix',
          description: 'Apply the agreed resolution and verify the issue is fully resolved',
          priority: 'HIGH',
          assignedAgent: 'Operations Agent',
          agentReason: 'Operations executes and verifies resolution',
          dependencies: ['Assess impact and affected parties'],
          requiresApproval: true,
          approvalReason: 'Resolution requires management approval before implementation',
          estimatedDuration: 45,
          status: 'pending',
          sequence: 3,
        },
        {
          title: 'Document resolution and close workflow',
          description: 'Document lessons learned, update procedures, and formally close the workflow',
          priority: 'MEDIUM',
          assignedAgent: 'Operations Agent',
          agentReason: 'Operations handles documentation and closure',
          dependencies: ['Implement resolution and verify fix'],
          requiresApproval: false,
          approvalReason: '',
          estimatedDuration: 15,
          status: 'pending',
          sequence: 4,
        },
      ],
      criticalPath: ['Investigate and document the issue', 'Implement resolution and verify fix'],
      parallelizable: [],
      escalationTriggers: ['Task delay > 2 hours', 'Customer escalation'],
      successCriteria: ['Issue resolved', 'Customer notified', 'Documentation complete'],
    };
  }
};

module.exports = planningAgent;
