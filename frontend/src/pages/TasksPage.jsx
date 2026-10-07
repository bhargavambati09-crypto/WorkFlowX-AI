import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../services/api';
import { TopBar } from '../components/layout/Sidebar';
import {
  StatusBadge, PriorityBadge, Skeleton, EmptyState, Spinner
} from '../components/ui/index.jsx';
import { toast } from '../components/ui/Toast';
import { formatDate, formatRelativeTime, getAgentInfo } from '../utils/helpers';
import {
  CheckSquare, Filter, Search, RefreshCw, Bot,
  Clock, ArrowUpRight, AlertTriangle, Layers
} from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const fetchTasks = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await taskAPI.getAll();
      setTasks(res.data.tasks || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(true);
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId);
    try {
      await taskAPI.update(taskId, { status: newStatus });
      toast.success(`Task status changed to ${newStatus}`);
      await fetchTasks();
    } catch (err) {
      toast.error('Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const counts = {
    all: tasks.length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <TopBar
        title="Task Management"
        subtitle="Autonomous decomposed tasks assigned across multi-agent fleet"
        actions={
          <button
            onClick={() => fetchTasks(true)}
            className="btn-secondary text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Task Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Tasks', count: counts.all, color: 'text-white' },
          { label: 'In Progress', count: counts.in_progress, color: 'text-brand-400' },
          { label: 'Pending', count: counts.pending, color: 'text-gray-400' },
          { label: 'Completed', count: counts.completed, color: 'text-emerald-400' },
          { label: 'Failed', count: counts.failed, color: 'text-red-400' },
          { label: 'Blocked', count: counts.blocked, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="stat-card p-4">
            <div className="text-[11px] text-gray-400 mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search tasks by title or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter size={14} /> Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-dark-800 border border-white/10 text-xs text-gray-300 rounded-lg px-2.5 py-1.5 focus:border-brand-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="blocked">Blocked</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-2">
            Priority:
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-dark-800 border border-white/10 text-xs text-gray-300 rounded-lg px-2.5 py-1.5 focus:border-brand-500 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No Tasks Found"
          description={tasks.length === 0 ? 'Create and run a workflow to populate autonomous tasks.' : 'No tasks match your filter criteria.'}
          action={tasks.length === 0 ? (
            <Link to="/workflows/new" className="btn-primary text-xs">
              Create New Workflow
            </Link>
          ) : null}
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const agent = getAgentInfo(task.assigned_agent);
            return (
              <div
                key={task.id}
                className={`glass-card p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                  task.status === 'failed'
                    ? 'border-red-500/30 bg-red-950/10'
                    : task.status === 'in_progress'
                    ? 'border-brand-500/30 bg-brand-950/10'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-gray-400 flex-shrink-0 mt-0.5">
                    #{task.task_order || 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.retry_count > 0 && (
                        <span className="text-[10px] text-amber-400 font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          Retries: {task.retry_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>

                    <div className="flex items-center gap-4 mt-2 flex-wrap text-[11px] text-gray-500 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Bot size={12} className="text-gray-400" />
                        Assigned:
                        <span className={`px-1.5 py-0.5 rounded border ${agent.color}`}>
                          {agent.name}
                        </span>
                      </span>

                      {task.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> SLA: {formatDate(task.deadline)}
                        </span>
                      )}

                      <span>Updated: {formatRelativeTime(task.updated_at || task.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                  {task.workflow_id && (
                    <Link
                      to={`/workflows/${task.workflow_id}`}
                      className="btn-secondary text-xs p-2"
                      title="View Workflow"
                    >
                      <ArrowUpRight size={14} />
                    </Link>
                  )}

                  <select
                    value={task.status}
                    disabled={updatingTaskId === task.id}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="bg-dark-800 border border-white/10 text-xs text-gray-300 rounded-lg px-2.5 py-1.5 focus:border-brand-500 focus:outline-none"
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
  );
}
