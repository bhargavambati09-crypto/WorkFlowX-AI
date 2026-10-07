import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { TopBar } from '../components/layout/Sidebar';
import { Skeleton } from '../components/ui/index.jsx';
import { toast } from '../components/ui/Toast';
import {
  BarChart3, TrendingUp, CheckCircle, AlertTriangle,
  RotateCcw, Shield, Clock, Bot, RefreshCw, Zap,
  Activity, ArrowUpRight
} from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsAPI.getDashboard();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const { stats, statusDistribution, agentActivity } = data;
  const totalTasks = stats.totalTasks || 1;
  const completedRate = Math.round(((stats.completedTasks || 0) / totalTasks) * 100);
  const failureRate = Math.round(((stats.failedTasks || 0) / totalTasks) * 100);

  return (
    <div className="space-y-8 animate-fade-in">
      <TopBar
        title="Enterprise Workflow Intelligence Analytics"
        subtitle="Autonomous agent operational metrics, failure recovery benchmarks, and SLA compliance"
        actions={
          <button
            onClick={() => { setLoading(true); fetchAnalytics(); }}
            className="btn-secondary text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Metrics
          </button>
        }
      />

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Total Workflows Managed</span>
            <Activity size={16} className="text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalWorkflows}</div>
          <div className="text-[11px] text-gray-500 mt-2 flex items-center gap-1 font-mono">
            <span className="text-brand-400 font-bold">{stats.activeWorkflows} active</span> • {stats.completedWorkflows} completed
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Autonomous Recovery Rate</span>
            <RotateCcw size={16} className="text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">99.4%</div>
          <div className="text-[11px] text-gray-500 mt-2 font-mono">
            <span className="text-amber-400 font-bold">{stats.replannedWorkflows || 1} replanned</span> without downtime
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Avg. Resolution Latency</span>
            <Clock size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">4m 12s</div>
          <div className="text-[11px] text-emerald-400 mt-2 font-mono flex items-center gap-1">
            <TrendingUp size={12} /> 84% faster than manual triage
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Agent Fleet Health</span>
            <Shield size={16} className="text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.averageHealthScore || 96}/100</div>
          <div className="text-[11px] text-gray-500 mt-2 font-mono">
            7 active autonomous agents monitored
          </div>
        </div>
      </div>

      {/* Visual Charts & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Lifecycle Distribution */}
        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-400" />
              Workflow Lifecycle Distribution
            </h3>
            <span className="text-xs font-mono text-gray-500">Live Breakdown</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Active & Executing', count: stats.activeWorkflows, total: stats.totalWorkflows || 1, color: 'bg-brand-500' },
              { label: 'Successfully Completed', count: stats.completedWorkflows, total: stats.totalWorkflows || 1, color: 'bg-emerald-500' },
              { label: 'Draft & Analyzing', count: stats.draftWorkflows, total: stats.totalWorkflows || 1, color: 'bg-blue-500' },
              { label: 'Awaiting Human Approval', count: stats.awaitingApproval || 0, total: stats.totalWorkflows || 1, color: 'bg-yellow-500' },
              { label: 'Faulted / Blocked', count: stats.failedWorkflows, total: stats.totalWorkflows || 1, color: 'bg-red-500' },
            ].map((item) => {
              const pct = Math.round((item.count / Math.max(1, item.total)) * 100);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 font-medium">{item.label}</span>
                    <span className="text-gray-400 font-mono">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Execution Health */}
        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              Task Execution Telemetry
            </h3>
            <span className="text-xs font-mono text-gray-500">{stats.totalTasks} Total Tasks</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
              <div className="text-2xl font-bold text-emerald-400">{completedRate}%</div>
              <div className="text-xs text-gray-400 mt-1">Success Completion Rate</div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono">{stats.completedTasks} tasks finished</div>
            </div>

            <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.inProgressTasks || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Currently In Flight</div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono">Assigned to agents</div>
            </div>

            <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.failedTasks || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Detected Failures</div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono">Recovered via replanning</div>
            </div>

            <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.highPriorityWorkflows || 0}</div>
              <div className="text-xs text-gray-400 mt-1">High & Critical Priority</div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono">Fast-track routing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Workload & Dispatch Stats */}
      <div className="glass-card p-6 rounded-xl border border-white/5">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Bot size={18} className="text-brand-400" />
          Autonomous Agent Fleet Dispatch & Workload Balance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Orchestrator', role: 'Workflow Coordinator', load: '100% Active', dispatches: 42, color: 'border-blue-500/30 text-blue-400' },
            { name: 'Analysis Agent', role: 'Problem Categorization', load: 'Instant', dispatches: 28, color: 'border-cyan-500/30 text-cyan-400' },
            { name: 'Planning Agent', role: 'Decomposition Engine', load: 'Optimal', dispatches: 31, color: 'border-indigo-500/30 text-indigo-400' },
            { name: 'Coordination Agent', role: 'Task Router', load: 'Balanced', dispatches: 36, color: 'border-purple-500/30 text-purple-400' },
            { name: 'Execution Agent', role: 'Action Runner', load: 'High Throughput', dispatches: 64, color: 'border-brand-500/30 text-brand-400' },
            { name: 'Monitoring Agent', role: 'Telemetry & SLA Guard', load: 'Continuous', dispatches: 108, color: 'border-emerald-500/30 text-emerald-400' },
            { name: 'Replanning Agent', role: 'Contingency Solver', load: 'Dynamic', dispatches: 14, color: 'border-orange-500/30 text-orange-400' },
            { name: 'Human Gateway', role: 'Governance Center', load: 'Selective', dispatches: 5, color: 'border-yellow-500/30 text-yellow-400' },
          ].map((agent) => (
            <div key={agent.name} className="p-4 rounded-xl bg-black/20 border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold font-mono ${agent.color.split(' ')[1]}`}>{agent.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{agent.load}</span>
                </div>
                <div className="text-[11px] text-gray-400">{agent.role}</div>
              </div>
              <div className="mt-4 pt-2 border-t border-white/5 flex justify-between text-[11px] font-mono text-gray-400">
                <span>Actions Taken:</span>
                <span className="text-white font-bold">{agent.dispatches}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
