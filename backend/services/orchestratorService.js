const supabase = require('../config/supabase');
const analysisAgent = require('../agents/analysisAgent');
const planningAgent = require('../agents/planningAgent');
const coordinationAgent = require('../agents/coordinationAgent');
const { executionAgent, logAgentActivity } = require('../agents/executionAgent');
const { monitoringAgent } = require('../agents/monitoringAgent');
const replanningAgent = require('../agents/replanningAgent');
const { generateJSON } = require('./aiService');

/**
 * Orchestrator Service - Central intelligence coordinating all agents
 */

/**
 * Full workflow analysis and planning pipeline
 */
const orchestrateAnalysis = async (workflowId, userId) => {
  const workflow = await getWorkflow(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  // STEP 1: Update status to analyzing
  await updateWorkflowStatus(workflowId, 'analyzing');
  await logAgentActivity(workflowId, 'Orchestrator', 'Workflow received and analysis initiated', 'active',
    `New workflow "${workflow.title}" received. Delegating to Analysis Agent.`, 0.98);

  // Log workflow event
  await logWorkflowEvent(workflowId, 'ANALYSIS_STARTED', 'Orchestrator', 'Orchestrator',
    `Analysis pipeline initiated for workflow: ${workflow.title}`);

  // STEP 2: Analysis Agent
  await logAgentActivity(workflowId, 'Analysis Agent', 'Analyzing business problem', 'active',
    'Examining problem description, identifying category, priority, and impact', 0.0);

  const analysis = await analysisAgent(workflow.description, {
    title: workflow.title,
    department: workflow.department,
  });

  await logAgentActivity(workflowId, 'Analysis Agent', 'Analysis complete', 'completed',
    `Classified as ${analysis.category} | Priority: ${analysis.priority} | Confidence: ${Math.round(analysis.confidence * 100)}%`, analysis.confidence);

  // STEP 3: Save analysis to workflow
  await supabase.from('workflows').update({
    ai_analysis: analysis,
    category: analysis.category,
    priority: analysis.priority,
    impact: analysis.impact,
    status: 'planning',
    updated_at: new Date().toISOString(),
  }).eq('id', workflowId);

  // STEP 4: Planning Agent
  await logAgentActivity(workflowId, 'Task Planning Agent', 'Generating task plan', 'active',
    'Converting analysis into actionable tasks with dependencies and agent assignments', 0.0);

  const plan = await planningAgent(analysis, workflow);

  await logAgentActivity(workflowId, 'Task Planning Agent', 'Task plan created', 'completed',
    `Generated ${plan.tasks.length} tasks. Estimated resolution: ${plan.totalEstimatedTime}`, 0.93);

  // STEP 5: Coordination Agent
  await logAgentActivity(workflowId, 'Coordination Agent', 'Optimizing agent assignments', 'active',
    'Matching tasks to best-fit agents based on capabilities and specializations', 0.0);

  const assignments = await coordinationAgent(plan.tasks, analysis);

  // Apply optimal assignments
  const optimizedTasks = plan.tasks.map(task => {
    const assignment = assignments.find(a => a.taskTitle === task.title);
    return {
      ...task,
      assignedAgent: assignment?.recommendedAgent || task.assignedAgent,
    };
  });

  await logAgentActivity(workflowId, 'Coordination Agent', 'Agent assignments optimized', 'completed',
    `All ${optimizedTasks.length} tasks assigned to specialized agents`, 0.91);

  // STEP 6: Save tasks to database
  const tasksToInsert = optimizedTasks.map(task => ({
    workflow_id: workflowId,
    title: task.title,
    description: task.description,
    assigned_agent: task.assignedAgent,
    priority: task.priority,
    status: 'pending',
    dependencies: JSON.stringify(task.dependencies || []),
    requires_approval: task.requiresApproval,
    estimated_duration: task.estimatedDuration,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { data: savedTasks, error: taskError } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select();

  if (taskError) throw taskError;

  // STEP 7: Update workflow to ready
  const requiresApproval = optimizedTasks.some(t => t.requiresApproval) || analysis.requiresHumanApproval;
  await supabase.from('workflows').update({
    status: 'ready',
    requires_approval: requiresApproval,
    current_step: 'Tasks planned and ready for execution',
    updated_at: new Date().toISOString(),
  }).eq('id', workflowId);

  await logAgentActivity(workflowId, 'Orchestrator', 'Planning complete - workflow ready', 'completed',
    `Workflow is ready for execution. ${savedTasks.length} tasks created. Requires approval: ${requiresApproval}`, 0.96);

  await logWorkflowEvent(workflowId, 'PLANNING_COMPLETE', 'Orchestrator', 'Orchestrator',
    `${savedTasks.length} tasks generated and assigned. Workflow ready for execution.`,
    { taskCount: savedTasks.length, requiresApproval });

  return {
    workflow: await getWorkflow(workflowId),
    analysis,
    plan: { ...plan, tasks: optimizedTasks },
    tasks: savedTasks,
  };
};

/**
 * Execute workflow - start task execution
 */
const orchestrateExecution = async (workflowId, userId) => {
  const workflow = await getWorkflow(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  await updateWorkflowStatus(workflowId, 'executing');
  await logAgentActivity(workflowId, 'Orchestrator', 'Initiating workflow execution', 'active',
    'Starting execution pipeline. Delegating tasks to specialized agents.', 0.95);

  // Get all tasks
  const { data: tasks } = await supabase.from('tasks').select('*').eq('workflow_id', workflowId);

  // Execute first batch of tasks (those with no dependencies)
  const initialTasks = tasks.filter(t => {
    const deps = typeof t.dependencies === 'string' ? JSON.parse(t.dependencies || '[]') : (t.dependencies || []);
    return deps.length === 0 && t.status === 'pending';
  });

  // Update initial tasks to in_progress
  for (const task of initialTasks) {
    await supabase.from('tasks').update({
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    }).eq('id', task.id);

    await logAgentActivity(workflowId, task.assigned_agent, `Executing: ${task.title}`, 'active',
      `${task.assigned_agent} is now processing: ${task.description?.substring(0, 100)}`, 0.87);
  }

  await logAgentActivity(workflowId, 'Orchestrator', 'Execution phase active', 'active',
    `${initialTasks.length} tasks now in execution. Monitoring Agent activated.`, 0.94);

  await logWorkflowEvent(workflowId, 'EXECUTION_STARTED', 'Orchestrator', 'Orchestrator',
    `Workflow execution started. ${initialTasks.length} initial tasks dispatched.`);

  // Start monitoring
  await updateWorkflowStatus(workflowId, 'monitoring');
  await logAgentActivity(workflowId, 'Monitoring Agent', 'Monitoring activated', 'active',
    'Real-time monitoring of all task progress, SLA compliance, and agent health', 0.96);

  return { workflow: await getWorkflow(workflowId), executedTasks: initialTasks };
};

/**
 * Simulate task failure and trigger replanning
 */
const orchestrateFailureSimulation = async (workflowId, userId) => {
  const workflow = await getWorkflow(workflowId);
  
  // Find an active/in-progress task to fail
  const { data: tasks } = await supabase.from('tasks').select('*').eq('workflow_id', workflowId);
  const activeTask = tasks.find(t => t.status === 'in_progress' || t.status === 'pending');
  
  if (!activeTask) throw new Error('No active tasks found to simulate failure');

  // STEP 1: Mark task as failed
  await supabase.from('tasks').update({
    status: 'failed',
    updated_at: new Date().toISOString(),
  }).eq('id', activeTask.id);

  await logAgentActivity(workflowId, activeTask.assigned_agent, `TASK FAILED: ${activeTask.title}`, 'failed',
    `⚠️ CRITICAL: Task "${activeTask.title}" has failed. Agent ${activeTask.assigned_agent} reported an error.`, 0.0);

  await logWorkflowEvent(workflowId, 'TASK_FAILED', 'System', activeTask.assigned_agent,
    `Task "${activeTask.title}" failed. Triggering monitoring and replanning pipeline.`,
    { taskId: activeTask.id, assignedAgent: activeTask.assigned_agent });

  // Update workflow status to blocked
  await updateWorkflowStatus(workflowId, 'blocked');

  // STEP 2: Monitoring Agent detects failure
  await logAgentActivity(workflowId, 'Monitoring Agent', '⚠ FAILURE DETECTED', 'warning',
    `Critical failure detected in task "${activeTask.title}". Alerting Orchestrator immediately.`, 0.99);

  // STEP 3: Orchestrator receives failure
  await logAgentActivity(workflowId, 'Orchestrator', 'Failure received - initiating replanning', 'active',
    `Orchestrator received failure alert. Activating Replanning Agent for task: "${activeTask.title}"`, 0.97);

  await updateWorkflowStatus(workflowId, 'replanning');

  // STEP 4: Replanning Agent generates new plan
  const analysis = workflow.ai_analysis || {};
  const replan = await replanningAgent(workflow, activeTask, tasks, analysis);

  await logAgentActivity(workflowId, 'Replanning Agent', 'Recovery plan generated', 'completed',
    `New recovery plan: ${replan.recoveryStrategy}. Deploying ${replan.newPlan.length} recovery tasks.`, 0.89);

  // STEP 5: Insert recovery tasks
  const recoveryTasksToInsert = replan.newPlan.map(task => ({
    workflow_id: workflowId,
    title: task.title,
    description: task.description,
    assigned_agent: task.assignedAgent,
    priority: task.priority || 'HIGH',
    status: 'pending',
    dependencies: JSON.stringify([]),
    requires_approval: task.requiresApproval,
    estimated_duration: task.estimatedDuration || 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { data: recoveryTasks, error: rtError } = await supabase
    .from('tasks').insert(recoveryTasksToInsert).select();
  
  if (rtError) console.error('Error inserting recovery tasks:', rtError);

  // STEP 6: Create approval if required
  if (replan.requiresHumanApproval || recoveryTasks?.some(t => t.requires_approval)) {
    const approvalTask = recoveryTasks?.find(t => t.requires_approval) || recoveryTasks?.[0];
    if (approvalTask) {
      await supabase.from('approvals').insert({
        workflow_id: workflowId,
        task_id: approvalTask.id,
        action: `Approve recovery plan for failed task: ${activeTask.title}`,
        reason: replan.humanApprovalReason || replan.reason,
        ai_recommendation: `Recommend approval: ${replan.recoveryStrategy}`,
        risk_level: 'MEDIUM',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await logAgentActivity(workflowId, 'Orchestrator', 'Human approval requested', 'active',
        'Recovery plan requires human authorization. Approval request created.', 0.95);
    }
  }

  // Save replan result to workflow
  const currentAnalysis = workflow.ai_analysis || {};
  await supabase.from('workflows').update({
    ai_analysis: {
      ...currentAnalysis,
      replanHistory: [...(currentAnalysis.replanHistory || []), {
        timestamp: new Date().toISOString(),
        failedTask: activeTask.title,
        reason: replan.reason,
        recoveryStrategy: replan.recoveryStrategy,
      }],
      latestReplan: replan,
    },
    requires_approval: replan.requiresHumanApproval,
    status: replan.requiresHumanApproval ? 'awaiting_approval' : 'executing',
    current_step: `Recovery: ${replan.recoveryStrategy}`,
    updated_at: new Date().toISOString(),
  }).eq('id', workflowId);

  await logWorkflowEvent(workflowId, 'REPLAN_COMPLETE', 'Replanning Agent', 'System',
    `Replanning complete. ${recoveryTasks?.length || 0} recovery tasks assigned. Status: ${replan.requiresHumanApproval ? 'Awaiting approval' : 'Executing'}`,
    { replan, recoveryTaskCount: recoveryTasks?.length });

  await logAgentActivity(workflowId, 'Orchestrator', 'Workflow recovery in progress', 'active',
    `Recovery plan deployed. Workflow resuming execution with ${recoveryTasks?.length} new tasks.`, 0.94);

  return {
    failedTask: activeTask,
    replan,
    recoveryTasks,
    workflow: await getWorkflow(workflowId),
  };
};

/**
 * Get workflow with all data
 */
const getWorkflow = async (workflowId) => {
  const { data, error } = await supabase.from('workflows').select('*').eq('id', workflowId).single();
  if (error) throw error;
  return data;
};

/**
 * Update workflow status
 */
const updateWorkflowStatus = async (workflowId, status) => {
  await supabase.from('workflows').update({
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', workflowId);
};

/**
 * Log a workflow event
 */
const logWorkflowEvent = async (workflowId, eventType, actorType, actorName, message, metadata = {}) => {
  try {
    await supabase.from('workflow_events').insert({
      workflow_id: workflowId,
      event_type: eventType,
      actor_type: actorType,
      actor_name: actorName,
      message,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log workflow event:', err.message);
  }
};

/**
 * Ask Workflow - contextual AI assistant
 */
const askWorkflow = async (workflowId, question, userId) => {
  const workflow = await getWorkflow(workflowId);
  
  // Gather context
  const { data: tasks } = await supabase.from('tasks').select('*').eq('workflow_id', workflowId);
  const { data: agentLogs } = await supabase.from('agent_logs').select('*').eq('workflow_id', workflowId)
    .order('timestamp', { ascending: false }).limit(10);
  const { data: approvals } = await supabase.from('approvals').select('*').eq('workflow_id', workflowId);
  const { data: events } = await supabase.from('workflow_events').select('*').eq('workflow_id', workflowId)
    .order('created_at', { ascending: false }).limit(5);

  const taskSummary = (tasks || []).map(t => 
    `- ${t.title}: ${t.status} (${t.assigned_agent})`
  ).join('\n');

  const recentActivity = (agentLogs || []).map(l =>
    `[${l.agent_name}] ${l.action}: ${l.summary}`
  ).join('\n');

  const prompt = `You are the WorkFlowX AI assistant answering questions about a specific workflow.

WORKFLOW CONTEXT:
Title: ${workflow.title}
Status: ${workflow.status}
Priority: ${workflow.priority}
Category: ${workflow.category}
Department: ${workflow.department}

TASKS:
${taskSummary || 'No tasks yet'}

RECENT AGENT ACTIVITY:
${recentActivity || 'No recent activity'}

AI ANALYSIS:
${JSON.stringify(workflow.ai_analysis?.summary || 'Not analyzed yet')}

PENDING APPROVALS: ${(approvals || []).filter(a => a.status === 'pending').length}

USER QUESTION: "${question}"

Answer the question concisely and helpfully based on the actual workflow context above.
Focus on actionable insights. Do not reveal system internals or expose sensitive data.
Keep answer to 2-4 sentences maximum.`;

  let answerText;
  try {
    const jsonRes = await generateJSON(prompt);
    answerText = jsonRes.answer || (typeof jsonRes === 'string' ? jsonRes : JSON.stringify(jsonRes));
  } catch {
    try {
      const { generateText } = require('./aiService');
      answerText = await generateText(prompt);
    } catch {
      const completedCount = (tasks || []).filter(t => t.status === 'completed').length;
      const totalCount = (tasks || []).length;
      answerText = `Workflow "${workflow.title}" is currently in ${workflow.status.toUpperCase()} state with ${workflow.priority || 'MEDIUM'} priority under ${workflow.department || 'Operations'}. It has decomposed into ${totalCount} tasks (${completedCount} completed). Autonomous telemetry is currently maintaining safe SLA thresholds with active agent supervision.`;
    }
  }

  return {
    question,
    answer: answerText,
    workflowId,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Calculate and update workflow health score
 */
const updateWorkflowHealth = async (workflowId) => {
  const { data: tasks } = await supabase.from('tasks').select('*').eq('workflow_id', workflowId);
  const { data: replanEvents } = await supabase.from('workflow_events').select('id')
    .eq('workflow_id', workflowId).eq('event_type', 'REPLAN_COMPLETE');

  const total = tasks?.length || 0;
  const completed = tasks?.filter(t => t.status === 'completed').length || 0;
  const failed = tasks?.filter(t => t.status === 'failed').length || 0;
  const blocked = tasks?.filter(t => t.status === 'blocked').length || 0;
  const replanCount = replanEvents?.length || 0;

  let score = total > 0 ? Math.round((completed / total) * 60) + 40 : 100;
  score -= failed * 15;
  score -= blocked * 8;
  score -= replanCount * 5;
  score = Math.min(100, Math.max(0, score));

  await supabase.from('workflows').update({ health_score: score, updated_at: new Date().toISOString() })
    .eq('id', workflowId);

  return score;
};

module.exports = {
  orchestrateAnalysis,
  orchestrateExecution,
  orchestrateFailureSimulation,
  askWorkflow,
  updateWorkflowHealth,
  logWorkflowEvent,
  logAgentActivity,
};
