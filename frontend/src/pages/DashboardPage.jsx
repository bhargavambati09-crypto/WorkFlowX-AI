import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, workflowAPI } from '../services/api';
import { TopBar } from '../components/layout/Sidebar';
import { StatusBadge, PriorityBadge, Skeleton, EmptyState, Spinner } from '../components/ui/index.jsx';
import { toast } from '../components/ui/Toast';
import { getAgentIcon, getAgentColor, formatDateTime, timeAgo } from '../utils/helpers';
import {
  GitBranch, CheckSquare, AlertTriangle, Activity, BarChart3, Zap,
  Plus, ArrowRight, TrendingUp, Bot, Clock, Shield, RefreshCw, Play
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, glowClass = 'hover:border-brand-500/40' }) => (
  <div className={`glass-card p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${glowClass} group`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-brand-400 transition-colors" />
    </div>
    <div className="text-3xl font-heading font-bold text-white tracking-tight mb-1 group-hover:text-brand-200 transition-colors">
      {value}
    </div>
    <div className="text-xs font-medium text-gray-400 tracking-wide">{label}</div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentWorkflows, setRecentWorkflows] = useState([]);
  const [agentActivity, setAgentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await analyticsAPI.getDashboard();
      const { stats: s, recentWorkflows: wf, recentAgentActivity: act } = res.data;
      setStats(s);
      setRecentWorkflows(wf || []);
      setAgentActivity(act || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await workflowAPI.createDemo();
      toast.success('Demo workflow created and analyzed!');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to create demo');
    } finally {
      setDemoLoading(false);
    }
  };

  const agentNames = ['Orchestrator', 'Analysis Agent', 'Task Planning Agent', 'Coordination Agent', 'Execution Agent', 'Monitoring Agent', 'Replanning Agent'];

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Dashboard"
        subtitle="Your AI workflow intelligence center"
        actions={
          <div className="flex gap-3">
            <button id="demo-workflow-btn" onClick={handleCreateDemo} disabled={demoLoading}
              className="btn-secondary text-sm">
              {demoLoading ? <Spinner size={14} /> : <Zap size={14} />}
              {demoLoading ? 'Creating...' : 'Try Demo Workflow'}
            </button>
            <Link to="/workflows/new" className="btn-primary text-sm">
              <Plus size={14} /> New Workflow
            </Link>
          </div>
        }
      />

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={GitBranch} label="Total Workflows" value={stats?.totalWorkflows || 0} color="bg-brand-600" glowClass="hover:border-brand-500/40 hover:shadow-glow-sm" />
          <StatCard icon={Activity} label="Active Workflows" value={stats?.activeWorkflows || 0} color="bg-blue-600" glowClass="hover:border-blue-500/40 hover:shadow-glow-cyan" />
          <StatCard icon={CheckSquare} label="Completed" value={stats?.completedWorkflows || 0} color="bg-emerald-600" glowClass="hover:border-emerald-500/40 hover:shadow-glow-emerald" />
          <StatCard icon={AlertTriangle} label="Pending Tasks" value={stats?.pendingTasks || 0} color="bg-amber-600" glowClass="hover:border-amber-500/40" />
          <StatCard icon={Zap} label="High Priority" value={stats?.highPriorityWorkflows || 0} color="bg-orange-600" glowClass="hover:border-orange-500/40" />
          <StatCard icon={AlertTriangle} label="Failed Tasks" value={stats?.failedTasks || 0} color="bg-red-600" glowClass="hover:border-red-500/40" />
          <StatCard icon={RefreshCw} label="Replanned" value={stats?.replannedWorkflows || 0} color="bg-purple-600" glowClass="hover:border-purple-500/40 hover:shadow-glow-sm" />
          <StatCard icon={Shield} label="Awaiting Approval" value={stats?.awaitingApproval || 0} color="bg-yellow-600" glowClass="hover:border-yellow-500/40" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Workflows */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title"><GitBranch size={18} className="text-brand-400" /> Recent Workflows</h2>
            <Link to="/workflows" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : recentWorkflows.length === 0 ? (
            <EmptyState icon={GitBranch} title="No workflows yet"
              description="Create your first workflow or try the demo"
              action={<button onClick={handleCreateDemo} disabled={demoLoading} className="btn-primary text-sm">{demoLoading ? 'Creating...' : 'Try Demo'}</button>}
            />
          ) : (
            <div className="space-y-3">
              {recentWorkflows.map(wf => (
                <Link key={wf.id} to={`/workflows/${wf.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 hover:border-brand-500/20 transition-all duration-200 group">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white group-hover:text-brand-300 transition-colors truncate">{wf.title}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <Clock size={10} />
                      {timeAgo(wf.created_at)}
                      {wf.department && <span>• {wf.department}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {wf.priority && <PriorityBadge priority={wf.priority} />}
                    <StatusBadge status={wf.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Agent Activity Feed */}
        <div className="glass-card p-6">
          <h2 className="section-title mb-6"><Bot size={18} className="text-brand-400" /> Agent Activity</h2>
          {loading ? (
            <div className="space-y-3">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : agentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Bot size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No agent activity yet</p>
              <p className="text-gray-700 text-xs mt-1">Run a demo workflow to see agents in action</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-80">
              {agentActivity.map((log, i) => (
                <div key={log.id || i} className="flex gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="text-base flex-shrink-0">{getAgentIcon(log.agent_name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-300">{log.agent_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{log.action}</div>
                    {log.timestamp && (
                      <div className="text-[10px] text-gray-700 mt-1">{timeAgo(log.timestamp)}</div>
                    )}
                  </div>
                  <StatusBadge status={log.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent Command Center Preview */}
      <div className="glass-card p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title"><Bot size={18} className="text-brand-400" /> Agent Command Center</h2>
          <Link to="/agents" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            Full Command Center <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {agentNames.map((name, i) => (
            <div key={name} className="glass-card p-3.5 text-center transition-all duration-300 hover:border-brand-500/40 hover:-translate-y-1 group">
              <div className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-110">{getAgentIcon(name)}</div>
              <div className="text-xs font-heading font-semibold text-gray-300 group-hover:text-white transition-colors truncate">
                {name.replace(' Agent', '').replace('Task Planning', 'Planning')}
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400 font-medium">Ready</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
