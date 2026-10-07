import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { approvalAPI } from '../services/api';
import { TopBar } from '../components/layout/Sidebar';
import {
  StatusBadge, Skeleton, EmptyState, Spinner
} from '../components/ui/index.jsx';
import { toast } from '../components/ui/Toast';
import { formatDate, formatRelativeTime } from '../utils/helpers';
import {
  Shield, Check, X, RefreshCw, AlertCircle,
  Clock, ArrowUpRight, CheckCircle, XCircle, Sparkles
} from 'lucide-react';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchApprovals = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await approvalAPI.getAll({ status: filter === 'ALL' ? undefined : filter });
      setApprovals(res.data.approvals || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals(true);
  }, [filter]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approvalAPI.approve(id);
      toast.success('Action approved! Autonomous execution proceeding.');
      await fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Specify justification for rejection:');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await approvalAPI.reject(id, { reason });
      toast.warning('Request rejected. AI replanning triggered.');
      await fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-8 animate-fade-in">
      <TopBar
        title="Human-in-the-Loop Governance Center"
        subtitle="Authorize high-impact agent interventions, monetary refunds, and sensitive operations"
        actions={
          <button
            onClick={() => fetchApprovals(true)}
            className="btn-secondary text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="border-b border-white/5 flex gap-4">
        {[
          { key: 'pending', label: 'Pending Decisions', icon: AlertCircle, count: pendingCount },
          { key: 'approved', label: 'Approved Actions', icon: CheckCircle },
          { key: 'rejected', label: 'Rejected Actions', icon: XCircle },
          { key: 'ALL', label: 'All History', icon: Shield },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              filter === key
                ? 'border-brand-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Icon size={16} />
            {label}
            {count !== undefined && count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Approval List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={Shield}
          title={filter === 'pending' ? 'Zero Pending Approvals' : 'No Approval Records'}
          description={
            filter === 'pending'
              ? 'All agent autonomous operations are cleared within safety thresholds. When an action crosses monetary or risk thresholds, it will show up here.'
              : 'No historical approvals found matching the current filter.'
          }
        />
      ) : (
        <div className="space-y-4">
          {approvals.map((appr) => {
            const isPending = appr.status === 'pending';
            return (
              <div
                key={appr.id}
                className={`glass-card p-6 rounded-xl border transition-all ${
                  isPending
                    ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/10 via-dark-800 to-dark-800 shadow-lg shadow-amber-500/5'
                    : 'border-white/5'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Info */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                        <Shield size={16} />
                      </div>
                      <h3 className="text-base font-bold text-white capitalize">
                        {appr.action_type?.replace(/_/g, ' ') || 'Action Approval'}
                      </h3>
                      <StatusBadge status={appr.status} />
                      {appr.workflow_id && (
                        <Link
                          to={`/workflows/${appr.workflow_id}`}
                          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-mono"
                        >
                          Workflow <ArrowUpRight size={12} />
                        </Link>
                      )}
                    </div>

                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="text-[11px] text-gray-500 uppercase tracking-wider font-mono mb-1">
                        Reason & Trigger:
                      </div>
                      <p className="text-sm text-gray-200">
                        {appr.reason || 'Payment was charged but downstream order record was not generated.'}
                      </p>
                    </div>

                    {/* AI Recommendation */}
                    <div className="bg-brand-500/10 border border-brand-500/20 p-3 rounded-lg flex items-start gap-2">
                      <Sparkles size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-brand-300">AI Governance Recommendation:</div>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {appr.ai_recommendation || 'Authorize full customer refund via Stripe ledger and dispatch notification email to prevent chargeback dispute.'}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-4 text-[11px] text-gray-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Requested: {formatDate(appr.created_at)}
                      </span>
                      {appr.reviewed_at && (
                        <span>
                          Reviewed: {formatRelativeTime(appr.reviewed_at)} by {appr.reviewed_by || 'Admin'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Decision Controls */}
                  {isPending && (
                    <div className="flex lg:flex-col gap-3 flex-shrink-0 self-end lg:self-center">
                      <button
                        onClick={() => handleApprove(appr.id)}
                        disabled={actionLoading === appr.id}
                        className="btn-primary text-xs py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 flex items-center gap-2"
                      >
                        {actionLoading === appr.id ? <Spinner size={14} /> : <Check size={16} />}
                        Approve Request
                      </button>
                      <button
                        onClick={() => handleReject(appr.id)}
                        disabled={actionLoading === appr.id}
                        className="btn-danger text-xs py-2.5 px-5 flex items-center gap-2"
                      >
                        <X size={16} />
                        Reject Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
