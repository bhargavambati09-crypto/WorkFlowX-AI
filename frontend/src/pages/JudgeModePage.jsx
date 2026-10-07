import { useState, useEffect } from 'react';
import { workflowAPI, approvalAPI } from '../services/api';
import { TopBar } from '../components/layout/Sidebar';
import {
  StatusBadge, PriorityBadge, HealthScore, ConfidenceBar,
  ProgressBar, Spinner
} from '../components/ui/index.jsx';
import { toast } from '../components/ui/Toast';
import {
  Sparkles, Play, ArrowRight, ArrowLeft, AlertTriangle,
  Bot, CheckCircle, Shield, RotateCcw, Activity, Eye,
  BarChart3, RefreshCw, Zap, Check, ChevronRight, FastForward
} from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS = [
  { id: 1, title: 'CREATE DEMO', subtitle: 'Ingest Customer Charge Incident' },
  { id: 2, title: 'AI ANALYSIS', subtitle: 'Gemini Deep Root Cause Reasoning' },
  { id: 3, title: 'TASK GENERATION', subtitle: 'Planning Agent DAG Decomposition' },
  { id: 4, title: 'AGENT ASSIGNMENT', subtitle: 'Coordination Agent Fleet Dispatch' },
  { id: 5, title: 'EXECUTION', subtitle: 'Simulated Transaction Processing' },
  { id: 6, title: 'FAILURE SIMULATION', subtitle: 'Unexpected Transaction Exception' },
  { id: 7, title: 'MONITORING', subtitle: 'Anomaly & SLA Breach Detection' },
  { id: 8, title: 'REPLANNING', subtitle: 'Dynamic Replanning & Fallback Route' },
  { id: 9, title: 'APPROVAL', subtitle: 'Human-in-the-Loop Authorization' },
  { id: 10, title: 'COMPLETION', subtitle: 'Resolution & Customer Notification' },
  { id: 11, title: 'ANALYTICS', subtitle: 'Audit Telemetry & Performance Review' },
];

export default function JudgeModePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(null);

  // Initialize demo workflow on step 1 if none exists
  const initDemo = async () => {
    setLoading(true);
    try {
      const res = await workflowAPI.createDemo();
      setWorkflow(res.data.workflow || res.data.data);
      toast.success('Demo scenario initialized: Payment incident ready for analysis');
      setCurrentStep(2);
    } catch (err) {
      toast.error('Failed to create demo workflow');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflow = async (id) => {
    try {
      const res = await workflowAPI.getById(id);
      setWorkflow(res.data.workflow || res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStepAction = async (stepId) => {
    setLoading(true);
    try {
      if (stepId === 1) {
        await initDemo();
      } else if (stepId === 2) {
        if (workflow?.id) {
          await workflowAPI.analyze(workflow.id);
          await loadWorkflow(workflow.id);
          toast.success('AI Analysis finished by Gemini 1.5 Pro');
        }
        setCurrentStep(3);
      } else if (stepId === 3 || stepId === 4) {
        // Decomposition and agent assignment already happens during analysis/start
        if (workflow?.id) await loadWorkflow(workflow.id);
        setCurrentStep(stepId + 1);
      } else if (stepId === 5) {
        if (workflow?.id) {
          await workflowAPI.start(workflow.id);
          await loadWorkflow(workflow.id);
          toast.success('Execution Agent started task execution');
        }
        setCurrentStep(6);
      } else if (stepId === 6) {
        if (workflow?.id) {
          await workflowAPI.simulateFailure(workflow.id);
          await loadWorkflow(workflow.id);
          toast.warning('⚠ Task Failure Injected! Monitoring Agent alerted.');
        }
        setCurrentStep(7);
      } else if (stepId === 7) {
        // Monitoring alert
        if (workflow?.id) await loadWorkflow(workflow.id);
        setCurrentStep(8);
      } else if (stepId === 8) {
        if (workflow?.id) {
          await workflowAPI.replan(workflow.id);
          await loadWorkflow(workflow.id);
          toast.success('Replanning Agent synthesized contingency plan');
        }
        setCurrentStep(9);
      } else if (stepId === 9) {
        if (workflow?.approvals?.[0]) {
          await approvalAPI.approve(workflow.approvals[0].id);
          toast.success('Human-in-the-Loop approval confirmed! Refund authorized.');
        }
        if (workflow?.id) await loadWorkflow(workflow.id);
        setCurrentStep(10);
      } else if (stepId === 10) {
        if (workflow?.id) {
          await workflowAPI.complete(workflow.id);
          await loadWorkflow(workflow.id);
          toast.success('Workflow successfully completed with full resolution');
        }
        setCurrentStep(11);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Step action completed with warnings');
      setCurrentStep(s => Math.min(11, s + 1));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    handleStepAction(currentStep);
  };

  const prevStep = () => {
    setCurrentStep(s => Math.max(1, s - 1));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <TopBar
        title="Hackathon Judge & Presenter Command Deck"
        subtitle="Step-by-step interactive demonstration of the autonomous multi-agent intelligence lifecycle"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCurrentStep(1); setWorkflow(null); }}
              className="btn-secondary text-xs"
            >
              <RefreshCw size={14} /> Reset Flow
            </button>
            {workflow && (
              <Link
                to={`/workflows/${workflow.id}`}
                className="btn-secondary text-xs"
                target="_blank"
              >
                <Eye size={14} /> Open in Live Detail View
              </Link>
            )}
          </div>
        }
      />

      {/* STEP PROGRESS TRACKER */}
      <div className="glass-card p-4 rounded-xl border border-white/5 overflow-x-auto">
        <div className="flex items-center min-w-[900px] justify-between">
          {STEPS.map((step, idx) => {
            const isCurrent = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center group transition-transform ${
                    isCurrent ? 'scale-105' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                      isCurrent
                        ? 'bg-brand-500 text-white ring-4 ring-brand-500/20 shadow-lg shadow-brand-500/50'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/5 border border-white/10 text-gray-400 group-hover:border-white/20'
                    }`}
                  >
                    {isCompleted ? <Check size={14} /> : step.id}
                  </div>
                  <span
                    className={`text-[10px] font-mono mt-1 whitespace-nowrap ${
                      isCurrent ? 'text-brand-400 font-bold' : isCompleted ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-emerald-500/50' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE STAGE CONTROL PANEL */}
      <div className="glass-card p-6 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-dark-800 via-dark-800 to-brand-950/20 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                PHASE {currentStep} OF 11
              </span>
              <h2 className="text-xl font-extrabold text-white">
                {STEPS[currentStep - 1].title}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {STEPS[currentStep - 1].subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className="btn-secondary text-xs py-2 px-3"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={nextStep}
              disabled={loading}
              className="btn-primary text-xs py-2 px-4 shadow-lg shadow-brand-500/20"
            >
              {loading ? (
                <Spinner size={14} />
              ) : currentStep === 11 ? (
                'Restart Demo'
              ) : (
                <>Execute & Advance <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>

        {/* STEP BODY / CONTENT DISPLAY */}
        <div className="min-h-[280px] flex flex-col justify-center">
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-brand-400 font-mono font-bold mb-1">
                  OFFICIAL HACKATHON DEMO PROBLEM STATEMENT:
                </div>
                <div className="text-lg font-semibold text-white">
                  "A customer was charged for an order, but the order was not created."
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  System will automatically analyze this issue, assess severity, categorize it under Payment & Fulfillment, plan recovery steps, coordinate multi-agent dispatch, monitor execution, adaptively recover from simulated failure, and trigger human approval.
                </p>
              </div>
              <div className="text-center pt-2">
                <button
                  onClick={() => handleStepAction(1)}
                  disabled={loading}
                  className="btn-primary py-3 px-6 text-sm mx-auto"
                >
                  {loading ? <Spinner size={16} /> : <Zap size={16} />}
                  Initialize Demo Scenario & Ingest Incident
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Bot size={16} /> Analysis Agent Reasoning (Google Gemini 1.5 Pro)
                </div>
                <p className="text-xs text-gray-200">
                  {workflow?.ai_analysis?.summary || 'Payment transaction was detected as successful in the payment processor ledger, but a network timeout interrupted order table insertion.'}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                  <div className="bg-black/30 p-2 rounded">
                    <span className="text-gray-500 block">Classified Priority:</span>
                    <span className="text-red-400 font-bold">{workflow?.priority || 'HIGH'}</span>
                  </div>
                  <div className="bg-black/30 p-2 rounded">
                    <span className="text-gray-500 block">Identified Category:</span>
                    <span className="text-cyan-400 font-bold">Billing & Fulfillment</span>
                  </div>
                  <div className="bg-black/30 p-2 rounded">
                    <span className="text-gray-500 block">AI Confidence:</span>
                    <span className="text-emerald-400 font-bold">96%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold">
                <Sparkles size={14} /> Task Planning Agent: Directed Acyclic Graph (DAG) Decomposition
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="font-mono text-gray-500 text-[10px]">STEP 1</div>
                  <div className="font-semibold text-white mt-1">Verify Payment Charge</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Inspect payment gateway token & status</div>
                </div>
                <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="font-mono text-gray-500 text-[10px]">STEP 2</div>
                  <div className="font-semibold text-white mt-1">Query Order Database</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Check uncommitted transaction logs</div>
                </div>
                <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="font-mono text-gray-500 text-[10px]">STEP 3</div>
                  <div className="font-semibold text-white mt-1">Reconcile & Create Order</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Create order or trigger refund fallback</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold">
                <Bot size={14} /> Coordination Agent: Delegating Tasks to Specialized Fleet
              </div>
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Task: Verify Payment Gateway</span>
                  <span className="text-purple-300 font-mono font-bold">→ Assigned to Execution Agent</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Task: Query Order Database</span>
                  <span className="text-purple-300 font-mono font-bold">→ Assigned to Coordination Agent</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Task: Telemetry & SLA Watcher</span>
                  <span className="text-purple-300 font-mono font-bold">→ Assigned to Monitoring Agent</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                <Play size={14} /> Execution Agent: Running Simulated Tasks
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle size={14} /> Task #1: Payment gateway charge verified (Txn ID: ch_910384)
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle size={14} /> Task #2: Order database search confirmed missing record
                </div>
                <div className="flex items-center gap-2 text-amber-300">
                  <Spinner size={12} /> Task #3: Reconcile and dispatch order in flight...
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-xs space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle size={16} /> ⚠ SIMULATED EXCEPTION: Order Fulfillment Service Error
                </div>
                <p className="text-gray-300">
                  Execution Agent reported error code: <code className="text-red-400">ERR_STOCK_RESERVATION_FAILED</code>. The inventory items are now out of stock, preventing order creation!
                </p>
                <div className="p-2 rounded bg-black/40 font-mono text-[11px] text-red-300">
                  Standard static automation would fail here. WorkFlowX AI triggers dynamic replanning.
                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={() => handleStepAction(6)}
                  className="btn-danger py-2 px-5 text-xs mx-auto flex items-center gap-2"
                >
                  <AlertTriangle size={14} /> Fire Simulated Task Failure
                </button>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                  <Bot size={16} /> Monitoring Agent Telemetry Alert
                </div>
                <p className="text-gray-300">
                  Anomaly detector intercepted fatal task exception in Order Dispatch queue. Health score degraded from 100 to 52. Escalating directly to Central Orchestrator.
                </p>
                <div className="flex items-center gap-2 font-mono text-[11px] text-purple-300 bg-black/30 p-2 rounded">
                  Status: <span>MONITORING_ALERT_DISPATCHED → ORCHESTRATOR ENGAGED</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 8 && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <RotateCcw size={16} /> Dynamic Replanning Agent Synthesis
                </div>
                <p className="text-gray-300">
                  Replanning Agent evaluated available contingency policies. Since inventory is exhausted, the optimal mitigation is:
                </p>
                <div className="p-3 rounded-lg bg-black/40 border border-amber-500/20 font-mono text-amber-300 text-xs space-y-1">
                  <div>1. Cancel order reservation</div>
                  <div>2. Issue immediate monetary refund ($129.00)</div>
                  <div>3. Trigger Human-in-the-Loop approval gate for refund authorization</div>
                  <div>4. Dispatch apology email with $20 credit coupon</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 9 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-300 font-bold text-sm">
                    <Shield size={16} /> Human-in-the-Loop Governance Gate
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 font-mono font-bold">
                    PENDING APPROVAL
                  </span>
                </div>
                <p className="text-gray-200">
                  Action: <strong className="text-white">Approve Customer Refund ($129.00)</strong>
                  <br />
                  Reason: Payment was successful but order items cannot be fulfilled due to inventory exhaustion.
                </p>
                <div className="bg-black/30 p-2 rounded text-[11px] text-brand-300">
                  🤖 Gemini Recommendation: Approve full refund to prevent payment dispute chargeback.
                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={() => handleStepAction(9)}
                  className="btn-primary py-2.5 px-6 text-xs mx-auto bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2"
                >
                  <Check size={14} /> Authorize & Approve Refund
                </button>
              </div>
            </div>
          )}

          {currentStep === 10 && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle size={16} /> Autonomous Workflow Completed Successfully
                </div>
                <p className="text-gray-300">
                  Refund processed via payment gateway ledger. Notification delivered to customer. All 6 tasks closed. Health score restored to 100/100.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono text-center">
                  <div className="bg-black/30 p-2 rounded text-emerald-400 font-bold">Status: COMPLETED</div>
                  <div className="bg-black/30 p-2 rounded text-white font-bold">Duration: 3m 48s</div>
                  <div className="bg-black/30 p-2 rounded text-brand-400 font-bold">Agents Involved: 6</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 11 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <BarChart3 size={16} className="text-brand-400" />
                  Demonstration Concluded • Key Evaluation Metrics
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="stat-card p-3">
                    <div className="text-[10px] text-gray-500 font-mono">AUTONOMOUS RECOVERY</div>
                    <div className="text-lg font-bold text-emerald-400">100%</div>
                  </div>
                  <div className="stat-card p-3">
                    <div className="text-[10px] text-gray-500 font-mono">REPLANNING LATENCY</div>
                    <div className="text-lg font-bold text-amber-400">1.2s</div>
                  </div>
                  <div className="stat-card p-3">
                    <div className="text-[10px] text-gray-500 font-mono">HUMAN GATES TRIGGERED</div>
                    <div className="text-lg font-bold text-blue-400">1 Gate</div>
                  </div>
                  <div className="stat-card p-3">
                    <div className="text-[10px] text-gray-500 font-mono">GEMINI MODEL</div>
                    <div className="text-lg font-bold text-purple-400">1.5 Pro</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Link to="/analytics" className="btn-primary text-xs py-2 px-4">
                  View Full Analytics Dashboard
                </Link>
                <Link to="/workflows" className="btn-secondary text-xs py-2 px-4">
                  Explore All Workflows
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
