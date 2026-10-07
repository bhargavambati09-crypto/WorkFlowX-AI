import { useState, useEffect } from 'react';
import { workflowAPI } from '../services/api';
import { TopBar } from '../components/layout/Sidebar';
import { StatusBadge, ConfidenceBar, Skeleton, EmptyState, Spinner } from '../components/ui/index.jsx';
import { formatRelativeTime, AGENT_METADATA, getAgentInfo } from '../utils/helpers';
import {
  Bot, Activity, Cpu, Shield, Clock, RefreshCw, Zap,
  CheckCircle, AlertTriangle, Eye, ArrowUpRight, Terminal,
  Sliders, Layers, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_AGENTS = [
  {
    name: 'Orchestrator',
    status: 'active',
    currentAction: 'Coordinating autonomous agents',
    lastActivity: 'Monitoring workflow telemetry and state transitions',
    confidence: 0.98,
    timestamp: new Date().toISOString(),
    description: 'Central governor directing multi-agent communication, workflow state machines, and delegation protocols.',
  },
  {
    name: 'Analysis Agent',
    status: 'idle',
    currentAction: 'Standby for incoming business problems',
    lastActivity: 'Completed problem categorization and root-cause classification',
    confidence: 0.95,
    timestamp: new Date().toISOString(),
    description: 'Parses unstructured text, determines priority, evaluates business impact, and extracts constraints.',
  },
  {
    name: 'Task Planning Agent',
    status: 'idle',
    currentAction: 'Awaiting decomposition triggers',
    lastActivity: 'Generated optimal dependency DAG and step decomposition',
    confidence: 0.92,
    timestamp: new Date().toISOString(),
    description: 'Decomposes complex goals into atomic, executable tasks with strict dependency trees and SLAs.',
  },
  {
    name: 'Coordination Agent',
    status: 'idle',
    currentAction: 'Balancing agent workloads',
    lastActivity: 'Delegated task queue to designated execution agents',
    confidence: 0.94,
    timestamp: new Date().toISOString(),
    description: 'Manages agent task assignment, skill matching, execution queues, and inter-agent handoffs.',
  },
  {
    name: 'Execution Agent',
    status: 'active',
    currentAction: 'Executing simulated enterprise transactions',
    lastActivity: 'Processed order reconciliation and API webhook simulation',
    confidence: 0.89,
    timestamp: new Date().toISOString(),
    description: 'Executes individual tasks, invokes simulated external services, and reports output metrics.',
  },
  {
    name: 'Monitoring Agent',
    status: 'active',
    currentAction: 'Live telemetry health & anomaly detection',
    lastActivity: 'Scanned 12 tasks across active pipelines with 0 undetected SLA breaches',
    confidence: 0.97,
    timestamp: new Date().toISOString(),
    description: 'Continuous real-time watcher detecting failures, bottlenecks, delays, and unexpected task errors.',
  },
  {
    name: 'Replanning Agent',
    status: 'idle',
    currentAction: 'Standby for failure escalation',
    lastActivity: 'Prepared contingency routing for fallback resolution',
    confidence: 0.93,
    timestamp: new Date().toISOString(),
    description: 'Autonomous recovery engine that re-evaluates blocked tasks, alters execution order, and generates fallback paths.',
  },
];

export default function AgentActivityPage() {
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState('ALL');

  const fetchData = async () => {
    try {
      const wfRes = await workflowAPI.getAll({ limit: 10 });
      const wfList = wfRes.data.workflows || wfRes.data.data || [];
      setWorkflows(wfList);

      const targetId = selectedWorkflowId || (wfList.length > 0 ? wfList[0].id : null);
      if (targetId) {
        const agentRes = await workflowAPI.getAgents(targetId);
        if (agentRes.data.agents && agentRes.data.agents.length > 0) {
          // Merge with descriptions
          const merged = agentRes.data.agents.map(a => {
            const def = DEFAULT_AGENTS.find(d => d.name.toLowerCase() === a.name.toLowerCase()) || {};
            return { ...def, ...a };
          });
          setAgents(merged);
        }
        if (agentRes.data.logs) {
          setLogs(agentRes.data.logs);
        }
      }
    } catch (err) {
      console.error('Failed to load agent activities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, [selectedWorkflowId]);

  const filteredLogs = logs.filter(l =>
    filterAgent === 'ALL' || l.agent_name?.toLowerCase().includes(filterAgent.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <TopBar
        title="Agent Command Center"
        subtitle="Live telemetry and multi-agent coordination system"
        actions={
          <div className="flex items-center gap-3">
            {workflows.length > 0 && (
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="bg-dark-800 border border-white/10 text-xs text-gray-300 rounded-lg px-3 py-2 focus:border-brand-500 focus:outline-none"
              >
                <option value="">Latest Active Workflow</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.title.slice(0, 32)}... ({w.status})
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="btn-secondary text-xs"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Sync Telemetry
            </button>
          </div>
        }
      />

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.map((agent) => {
          const info = getAgentInfo(agent.name);
          const isBusy = ['active', 'executing', 'analyzing', 'planning', 'replanning', 'monitoring'].includes(agent.status);

          return (
            <div
              key={agent.name}
              className={`glass-card p-5 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${
                isBusy ? 'border-brand-500/40 shadow-lg shadow-brand-500/5' : 'border-white/5'
              }`}
            >
              <div>
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-400">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                      <div className="text-[10px] text-gray-500 font-mono">Autonomous Subsystem</div>
                    </div>
                  </div>
                  <StatusBadge status={agent.status || 'idle'} />
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                  {agent.description || info.desc}
                </p>

                {/* Current Action */}
                <div className="bg-black/20 p-3 rounded-lg border border-white/5 mb-3">
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Activity size={10} className="text-brand-400" />
                    Current Action
                  </div>
                  <div className="text-xs font-medium text-gray-200">
                    {agent.currentAction || 'Awaiting dispatch'}
                  </div>
                </div>

                {/* Last Activity */}
                <div className="text-xs text-gray-400 mb-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-mono mb-0.5">Last Log:</span>
                  <span className="line-clamp-2 text-gray-300 text-[11px]">{agent.lastActivity || 'None'}</span>
                </div>
              </div>

              {/* Confidence & Timestamp Footer */}
              <div className="pt-3 border-t border-white/5 mt-2 space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                    <span>Model Confidence</span>
                    <span>{Math.round((agent.confidence || 0.92) * 100)}%</span>
                  </div>
                  <ConfidenceBar value={agent.confidence || 0.92} />
                </div>
                {agent.timestamp && (
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span className="flex items-center gap-1"><Clock size={10} /> Active:</span>
                    <span>{formatRelativeTime(agent.timestamp)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Agent Activity Terminal / Stream */}
      <div className="glass-card p-6 rounded-xl border border-white/5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-brand-400" />
            <h3 className="text-base font-bold text-white">Live Multi-Agent Communication Stream</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Filter Agent:</span>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="bg-dark-800 border border-white/10 text-xs text-gray-300 rounded-lg px-2.5 py-1 focus:border-brand-500 focus:outline-none"
            >
              <option value="ALL">All Agents</option>
              {DEFAULT_AGENTS.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs font-mono">
            Waiting for agent communication signals... Run a workflow or simulate failure to see real-time agent message logs.
          </div>
        ) : (
          <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto pr-2">
            {filteredLogs.map((log) => {
              const info = getAgentInfo(log.agent_name);
              return (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-black/30 border border-white/5 flex items-start gap-3 hover:border-white/10 transition-colors"
                >
                  <span className="text-[10px] text-gray-500 flex-shrink-0 mt-0.5">
                    {new Date(log.created_at || log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${info.color}`}>
                    {info.name}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-200 font-semibold mr-2">[{log.action}]</span>
                    <span className="text-gray-400">{log.message}</span>
                    {log.payload && (
                      <div className="text-[10px] text-gray-500 mt-1 truncate">
                        Payload: {typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
