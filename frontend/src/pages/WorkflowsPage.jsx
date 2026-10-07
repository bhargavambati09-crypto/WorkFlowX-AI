import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workflowAPI } from '../services/api';
import { TopBar } from '../components/layout/Sidebar';
import { StatusBadge, PriorityBadge, Skeleton, EmptyState, Spinner } from '../components/ui/index.jsx';
import { toast } from '../components/ui/Toast';
import { formatDateTime, timeAgo } from '../utils/helpers';
import { GitBranch, Plus, Search, Filter, Clock, ArrowRight, Zap } from 'lucide-react';

const WorkflowsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [demoLoading, setDemoLoading] = useState(false);

  const fetchWorkflows = async () => {
    try {
      const res = await workflowAPI.getAll();
      setWorkflows(res.data.workflows || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkflows(); }, []);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await workflowAPI.createDemo();
      toast.success('Demo workflow created and analyzed!');
      fetchWorkflows();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to create demo');
    } finally {
      setDemoLoading(false);
    }
  };

  const filtered = workflows.filter(wf => {
    const matchSearch = !search || wf.title.toLowerCase().includes(search.toLowerCase()) || wf.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || wf.status === filter;
    return matchSearch && matchFilter;
  });

  const statusFilters = ['all', 'draft', 'analyzing', 'ready', 'executing', 'monitoring', 'awaiting_approval', 'completed', 'failed'];

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Workflows"
        subtitle={`${workflows.length} total workflow${workflows.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex gap-3">
            <button onClick={handleDemo} disabled={demoLoading} className="btn-secondary text-sm">
              {demoLoading ? <Spinner size={14} /> : <Zap size={14} />}
              {demoLoading ? 'Creating...' : 'Demo Workflow'}
            </button>
            <Link to="/workflows/new" className="btn-primary text-sm">
              <Plus size={14} /> New Workflow
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search workflows..."
            className="input-field pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                filter === s ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' : 'text-gray-500 border-white/10 hover:border-white/20 hover:text-gray-300'
              }`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow Grid */}
      {loading ? (
        <div className="grid gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title={search ? 'No workflows match your search' : 'No workflows yet'}
          description={search ? 'Try a different search term' : 'Create your first workflow or try the demo to see WorkFlowX AI in action'}
          action={
            !search && (
              <div className="flex gap-3">
                <button onClick={handleDemo} disabled={demoLoading} className="btn-secondary">
                  {demoLoading ? <Spinner size={14} /> : <Zap size={14} />} Try Demo
                </button>
                <Link to="/workflows/new" className="btn-primary"><Plus size={14} /> New Workflow</Link>
              </div>
            )
          }
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map(wf => (
            <Link key={wf.id} to={`/workflows/${wf.id}`}
              className="glass-card-hover p-6 flex items-center gap-6 group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                <GitBranch size={22} className="text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white group-hover:text-brand-300 transition-colors truncate">{wf.title}</h3>
                <p className="text-sm text-gray-500 mt-1 truncate">{wf.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                  {wf.department && <span>📍 {wf.department}</span>}
                  <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(wf.created_at)}</span>
                  {wf.category && <span>🏷 {wf.category}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {wf.priority && <PriorityBadge priority={wf.priority} />}
                <StatusBadge status={wf.status} />
                <div className="text-gray-600 group-hover:text-brand-400 transition-colors">
                  <ArrowRight size={18} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowsPage;
