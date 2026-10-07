// Shared UI components

// Status Badge
export const StatusBadge = ({ status }) => {
  const colors = {
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    analyzing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    planning: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    ready: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    executing: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
    monitoring: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    blocked: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    replanning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    awaiting_approval: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    in_progress: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
    active: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    idle: 'bg-gray-600/20 text-gray-500 border-gray-600/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const dots = {
    executing: 'bg-brand-400',
    monitoring: 'bg-purple-400',
    analyzing: 'bg-blue-400',
    planning: 'bg-indigo-400',
    replanning: 'bg-orange-400',
    in_progress: 'bg-brand-400',
    active: 'bg-brand-400',
  };

  const hasAnimation = !!dots[status];
  const cls = colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${cls}`}>
      {hasAnimation && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dots[status]}`} />
      )}
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

// Priority Badge
export const PriorityBadge = ({ priority }) => {
  const colors = {
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const cls = colors[priority] || 'bg-gray-500/20 text-gray-400';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${cls}`}>
      {priority === 'CRITICAL' && '⚠ '}{priority}
    </span>
  );
};

// Loading Skeleton
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

// Loading Spinner
export const Spinner = ({ size = 20, className = '' }) => (
  <div
    className={`border-2 border-white/10 border-t-brand-400 rounded-full animate-spin ${className}`}
    style={{ width: size, height: size }}
  />
);

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-600" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
    {description && <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>}
    {action}
  </div>
);

// Progress Bar
export const ProgressBar = ({ value, max = 100, color = 'brand' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
};

// Health Score Ring
export const HealthScore = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold text-white">{score}</div>
        <div className="text-[9px] text-gray-500">/100</div>
      </div>
    </div>
  );
};

// Confidence Bar
export const ConfidenceBar = ({ value }) => {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-brand-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-400">{pct}%</span>
    </div>
  );
};

// Modal
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass-card w-full ${sizes[size]} animate-fade-in`}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Confirm Dialog
export const ConfirmDialog = ({ open, onConfirm, onCancel, title, message, confirmLabel = 'Confirm', danger = false }) => (
  <Modal open={open} onClose={onCancel} title={title} size="sm">
    <p className="text-gray-400 mb-6 text-sm">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onCancel} className="btn-secondary">Cancel</button>
      <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
    </div>
  </Modal>
);
