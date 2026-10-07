import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { workflowAPI, taskAPI, approvalAPI } from '../services/api';
import { TopBar } from '../components/layout/Sidebar';
import {
  StatusBadge, PriorityBadge, HealthScore, ConfidenceBar,
  ProgressBar, Skeleton, EmptyState, Spinner
} from '../components/ui/index.jsx';
import { toast } from '../components/ui/Toast';
import {
  formatDate, formatRelativeTime, AGENT_METADATA,
  TASK_STATUS_LABELS, getAgentInfo
} from '../utils/helpers';
import {
  Play, Pause, RefreshCw, AlertTriangle, CheckCircle,
  Clock, Bot, Shield, ArrowRight, MessageSquare,
  Sparkles, Layers, Activity, ChevronRight, Check, X,
  RotateCcw, Info, UserCheck, AlertCircle
} from 'lucide-react';

export default function WorkflowDetailsPage() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [actionLoading, setActionLoading] = useState(null);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [answering, setAnswering] = useState(false);
  const [failureFlowStep, setFailureFlowStep] = useState(null);

  const fetchWorkflow = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await workflowAPI.getById(id);
      setWorkflow(res.data.workflow || res.data.data);
    } catch (err) {
      toast.error('Failed to load workflow details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow(true);
    const interval = setInterval(() => fetchWorkflow(false), 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleStart = async () => {
    setActionLoading('start');
    try {
      await workflowAPI.start(id);
      toast.success('Autonomous workflow execution initiated');
      await fetchWorkflow();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start workflow');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateFailure = async () => {
    setActionLoading('simulate');
    setFailureFlowStep(1); // 1: Detected
    try {
      const res = await workflowAPI.simulateFailure(id);
      toast.warning('Task failure simulated! Autonomous replanning activated.');

      // Animate failure flow steps for presentation
      setTimeout(() => setFailureFlowStep(2), 700);  // Monitoring
      setTimeout(() => setFailureFlowStep(3), 1400); // Orchestrator
      setTimeout(() => setFailureFlowStep(4), 2100); // Replanning
      setTimeout(() => setFailureFlowStep(5), 2800); // Reassigned / Continuing
      setTimeout(() => setFailureFlowStep(null), 6000);

      await fetchWorkflow();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to simulate failure');
      setFailureFlowStep(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReplan = async () => {
    setActionLoading('replan');
    try {
      await workflowAPI.replan(id);
      toast.success('Workflow replanned successfully by Replanning Agent');
      await fetchWorkflow();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to replan workflow');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    setActionLoading('complete');
    try {
      await workflowAPI.complete(id);
      toast.success('Workflow marked as completed');
      await fetchWorkflow();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete workflow');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.update(taskId, { status: newStatus });
      toast.success(`Task status updated to ${newStatus}`);
      await fetchWorkflow();
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const handleApprove = async (approvalId) => {
    try {
      await approvalAPI.approve(approvalId);
      toast.success('Approval granted! Task execution resuming.');
      await fetchWorkflow();
    } catch (err) {
      toast.error('Failed to process approval');
    }
  };

  const handleReject = async (approvalId) => {
    const reason = window.prompt('Enter reason for rejection:');
    if (reason === null) return;
    try {
      await approvalAPI.reject(approvalId, { reason });
      toast.warning('Request rejected. Replanning may be triggered.');
      await fetchWorkflow();
    } catch (err) {
      toast.error('Failed to reject request');
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAnswering(true);
    setAiAnswer(null);
    try {
      const res = await workflowAPI.ask(id, question);
      setAiAnswer(res.data.answer || res.data.data);
      setQuestion('');
    } catch (err) {
      toast.error('AI assistant failed to answer');
    } finally {
      setAnswering(false);
    }
  };

  if (loading && !workflow) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <EmptyState
        title="Workflow Not Found"
        description="The workflow you requested could not be located."
        action={<Link to="/workflows" className="btn-primary">Back to Workflows</Link>}
      />
    );
  }

  const tasks = workflow.tasks || [];
  const logs = workflow.logs || [];
  const approvals = workflow.approvals || [];
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const analysis = workflow.ai_analysis || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Bar */}
      <TopBar
        title={workflow.title}
        subtitle={`Workflow ID: ${workflow.id.slice(0, 8)} • Department: ${workflow.department || 'Operations'}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchWorkflow(true)}
              className="btn-secondary text-xs"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            {['draft', 'ready', 'analyzing'].includes(workflow.status) && (
              <button
                onClick={handleStart}
                disabled={actionLoading === 'start'}
                className="btn-primary text-xs"
              >
                {actionLoading === 'start' ? <Spinner size={14} /> : <Play size={14} />}
                Start Execution
              </button>
            )}

            {/* HIGH VISIBILITY SIMULATE FAILURE BUTTON */}
            {['executing', 'in_progress', 'ready'].includes(workflow.status) && (
              <button
                onClick={handleSimulateFailure}
                disabled={actionLoading === 'simulate'}
                className="btn-danger text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/20 border-red-500/40"
              >
                {actionLoading === 'simulate' ? <Spinner size={14} /> : <AlertTriangle size={14} />}
                Simulate Task Failure
              </button>
            )}

            {['blocked', 'replanning', 'failed'].includes(workflow.status) && (
              <button
                onClick={handleReplan}
                disabled={actionLoading === 'replan'}
                className="btn-secondary text-xs text-amber-400 border-amber-500/30"
              >
                {actionLoading === 'replan' ? <Spinner size={14} /> : <RotateCcw size={14} />}
                Replan Workflow
              </button>
            )}

            {workflow.status !== 'completed' && (
              <button
                onClick={handleComplete}
                disabled={actionLoading === 'complete'}
                className="btn-secondary text-xs text-emerald-400 hover:border-emerald-500/30"
              >
                {actionLoading === 'complete' ? <Spinner size={14} /> : <CheckCircle size={14} />}
                Complete
              </button>
            )}
          </div>
        }
      />

      {/* DYNAMIC FAILURE RECOVERY PIPELINE BANNER */}
      {(failureFlowStep !== null || workflow.status === 'replanning') && (
        <div className="glass-card border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-brand-950/40 p-4 rounded-xl animate-fade-in shadow-xl">
          <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-sm tracking-wide">
            <AlertCircle size={18} className="animate-bounce text-amber-400" />
            AUTONOMOUS MULTI-AGENT FAILURE RECOVERY PIPELINE
          </div>
          <div className="flex items-center justify-between overflow-x-auto py-2 text-xs gap-2">
            <div className={`px-3 py-2 rounded-lg border font-mono flex items-center gap-2 whitespace-nowrap ${
              failureFlowStep === 1 ? 'bg-red-500/20 text-red-400 border-red-500/50 scale-105 transition-transform' : 'bg-white/5 text-gray-400 border-white/10'
            }`}>
              <AlertTriangle size={13} className="text-red-400" />
              ⚠ TASK FAILURE DETECTED
            </div>
            <ArrowRight size={14} className="text-gray-500 flex-shrink-0" />

            <div className={`px-3 py-2 rounded-lg border font-mono flex items-center gap-2 whitespace-nowrap ${
              failureFlowStep === 2 ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 scale-105 transition-transform' : 'bg-white/5 text-gray-400 border-white/10'
            }`}>
              <Bot size={13} className="text-purple-400" />
              MONITORING AGENT
            </div>
            <ArrowRight size={14} className="text-gray-500 flex-shrink-0" />

            <div className={`px-3 py-2 rounded-lg border font-mono flex items-center gap-2 whitespace-nowrap ${
              failureFlowStep === 3 ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 scale-105 transition-transform' : 'bg-white/5 text-gray-400 border-white/10'
            }`}>
              <Activity size={13} className="text-blue-400" />
              ORCHESTRATOR
            </div>
            <ArrowRight size={14} className="text-gray-500 flex-shrink-0" />

            <div className={`px-3 py-2 rounded-lg border font-mono flex items-center gap-2 whitespace-nowrap ${
              failureFlowStep === 4 ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 scale-105 transition-transform' : 'bg-white/5 text-gray-400 border-white/10'
            }`}>
              <RotateCcw size={13} className="text-amber-400 animate-spin" />
              REPLANNING AGENT
            </div>
            <ArrowRight size={14} className="text-gray-500 flex-shrink-0" />

            <div className={`px-3 py-2 rounded-lg border font-mono flex items-center gap-2 whitespace-nowrap ${
              failureFlowStep === 5 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 scale-105 transition-transform' : 'bg-white/5 text-gray-400 border-white/10'
            }`}>
              <CheckCircle size={13} className="text-emerald-400" />
              TASK REASSIGNED & CONTINUING
            </div>
          </div>
        </div>
      )}

      {/* Workflow Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="text-xs text-gray-400 mb-1">Status</div>
          <div className="flex items-center gap-2">
            <StatusBadge status={workflow.status} />
          </div>
        </div>

        <div className="stat-card">
          <div className="text-xs text-gray-400 mb-1">Priority</div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={workflow.priority || 'MEDIUM'} />
          </div>
        </div>

        <div className="stat-card">
          <div className="text-xs text-gray-400 mb-1">Business Impact</div>
          <div className="text-sm font-semibold text-white capitalize">
            {workflow.business_impact || analysis.business_impact || 'Moderate'}
          </div>
        </div>

        <div className="stat-card">
          <div className="text-xs text-gray-400 mb-1">Task Progress</div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-white">{completedTasks}/{tasks.length}</span>
            <span className="text-xs font-mono text-brand-400">{progressPct}%</span>
          </div>
          <ProgressBar value={progressPct} />
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Workflow Health</div>
            <div className="text-xs text-gray-500">Autonomous Score</div>
          </div>
          <HealthScore score={workflow.health_score || (workflow.status === 'failed' ? 35 : workflow.status === 'replanning' ? 62 : 92)} />
        </div>
      </div>

      {/* Pending Approval Alert if any */}
      {approvals.some(a => a.status === 'pending') && (
        <div className="glass-card border-yellow-500/40 bg-yellow-500/5 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center flex-shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <div className="font-semibold text-yellow-300 text-sm">Human-in-the-Loop Approval Required</div>
              <div className="text-xs text-gray-300 mt-0.5">
                {approvals.find(a => a.status === 'pending')?.action_type || 'Refund authorization'}: {approvals.find(a => a.status === 'pending')?.reason}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                const item = approvals.find(a => a.status === 'pending');
                if (item) handleApprove(item.id);
              }}
              className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500"
            >
              <Check size={14} /> Approve
            </button>
            <button
              onClick={() => {
                const item = approvals.find(a => a.status === 'pending');
                if (item) handleReject(item.id);
              }}
              className="btn-danger text-xs py-1.5 px-3"
            >
              <X size={14} /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/5 flex gap-4">
        {[
          { key: 'tasks', label: `Tasks (${tasks.length})`, icon: Layers },
          { key: 'analysis', label: 'AI Intelligence & Reasoning', icon: Sparkles },
          { key: 'agents', label: `Agent Activity (${logs.length})`, icon: Bot },
          { key: 'approvals', label: `Approvals (${approvals.length})`, icon: Shield },
          { key: 'ask', label: 'Ask Gemini Assistant', icon: MessageSquare },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === key
                ? 'border-brand-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Decomposed Tasks & Agent Assignments</h2>
            <div className="text-xs text-gray-400 font-mono">
              Completed: {completedTasks} of {tasks.length}
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-400">
              <Layers size={32} className="mx-auto mb-2 text-gray-600" />
              <p>No tasks generated yet. Start execution to have Planning Agent decompose this workflow.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {tasks.map((task, idx) => {
                const agent = getAgentInfo(task.assigned_agent);
                return (
                  <div
                    key={task.id}
                    className={`glass-card p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border transition-all ${
                      task.status === 'failed'
                        ? 'border-red-500/40 bg-red-950/10'
                        : task.status === 'in_progress'
                        ? 'border-brand-500/40 bg-brand-950/10'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-gray-400 flex-shrink-0 mt-0.5">
                        #{task.task_order || idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-white truncate">{task.title}</h4>
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                        
                        {/* Assigned agent badge */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] text-gray-500">Assigned:</span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border ${agent.color}`}>
                            <Bot size={11} />
                            {agent.name}
                          </span>
                          {task.retry_count > 0 && (
                            <span className="text-[11px] text-amber-400 font-mono">
                              (Retried {task.retry_count}x)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Status Selector */}
                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                        className="bg-dark-700 border border-white/10 text-xs text-gray-300 rounded-lg px-2.5 py-1.5 focus:border-brand-500 focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: AI INTELLIGENCE & REASONING */}
      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-brand-400" />
                  Gemini Deep Reasoning Analysis
                </h3>
                <span className="text-xs font-mono text-gray-400">
                  Model: Google Gemini 1.5 Pro
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5">
                {analysis.summary || analysis.problem_summary || workflow.description}
              </p>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Root Cause Hypothesis</h4>
                <p className="text-xs text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
                  {analysis.root_cause || 'Payment gateway confirmed charge event (txn_success), but downstream order dispatch queue timed out prior to receipt generation.'}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Autonomous Strategy</h4>
                <p className="text-xs text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
                  {analysis.strategy || 'Verify ledger transaction, confirm merchant reconciliation status, trigger automatic refund or manual approval based on threshold.'}
                </p>
              </div>
            </div>

            {/* AI Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="glass-card p-6 rounded-xl">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Info size={16} className="text-brand-400" />
                  Recommended Autonomous Actions
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2 bg-white/5 p-2.5 rounded-lg">
                      <span className="text-brand-400 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Side metadata */}
          <div className="space-y-4">
            <div className="glass-card p-5 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Classification Confidence</h4>
              <ConfidenceBar value={analysis.confidence || 0.94} />
              <div className="text-[11px] text-gray-400 pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="text-white font-medium">{analysis.category || workflow.category || 'Operations'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Urgency:</span>
                  <span className="text-white font-medium">{analysis.urgency || 'High'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Resolution:</span>
                  <span className="text-white font-mono">{analysis.estimated_duration || '4m 30s'}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Original Problem Input</h4>
              <p className="text-xs text-gray-300 italic">{workflow.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AGENT ACTIVITY LOGS */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-brand-400" />
              Autonomous Agent Interaction Feed
            </h3>
            <span className="text-xs text-gray-400 font-mono">Real-time Stream</span>
          </div>

          {logs.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-400">
              <Bot size={32} className="mx-auto mb-2 text-gray-600" />
              <p>No agent activities logged yet. Activities will appear as agents plan, coordinate, and execute.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const agent = getAgentInfo(log.agent_name);
                return (
                  <div
                    key={log.id}
                    className="glass-card p-3 rounded-lg flex items-start gap-3 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-gray-300">
                      <Bot size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${agent.color}`}>
                          {agent.name}
                        </span>
                        <span className="text-xs font-semibold text-white">{log.action}</span>
                        <span className="text-[11px] text-gray-500 font-mono ml-auto">
                          {formatRelativeTime(log.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{log.message}</p>
                      {log.payload && (
                        <pre className="text-[10px] font-mono text-gray-400 bg-black/30 p-2 rounded mt-2 overflow-x-auto max-h-32">
                          {typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield size={16} className="text-amber-400" />
              Human-in-the-Loop Governance
            </h3>
          </div>

          {approvals.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-400">
              <Shield size={32} className="mx-auto mb-2 text-gray-600" />
              <p>No approvals requested for this workflow.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((appr) => (
                <div
                  key={appr.id}
                  className="glass-card p-5 rounded-xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white capitalize">{appr.action_type || 'Action Approval'}</span>
                      <StatusBadge status={appr.status} />
                    </div>
                    <p className="text-xs text-gray-300">{appr.reason}</p>
                    {appr.ai_recommendation && (
                      <div className="text-xs text-brand-300 bg-brand-500/10 border border-brand-500/20 p-2 rounded mt-2">
                        🤖 AI Recommendation: {appr.ai_recommendation}
                      </div>
                    )}
                  </div>

                  {appr.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(appr.id)}
                        className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(appr.id)}
                        className="btn-danger text-xs py-1.5 px-3"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ASK GEMINI */}
      {activeTab === 'ask' && (
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-brand-400 font-bold text-sm">
            <Sparkles size={16} />
            Ask Gemini About This Workflow
          </div>
          <p className="text-xs text-gray-400">
            Ask any questions regarding the agents reasoning, task dependencies, bottleneck risks, or proposed alternatives.
          </p>

          <form onSubmit={handleAskQuestion} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Why was this assigned to Coordination Agent instead of Execution Agent?"
              className="input-field flex-1 text-xs"
            />
            <button
              type="submit"
              disabled={answering || !question.trim()}
              className="btn-primary text-xs"
            >
              {answering ? <Spinner size={14} /> : 'Ask Gemini'}
            </button>
          </form>

          {aiAnswer && (
            <div className="glass-card bg-white/5 border-white/10 p-4 rounded-xl mt-4 animate-fade-in">
              <div className="text-xs font-semibold text-brand-400 mb-1 flex items-center gap-1.5">
                <Bot size={14} /> Gemini Intelligence Response:
              </div>
              <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
