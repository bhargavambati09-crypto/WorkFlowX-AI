// WorkFlowX AI - Elevated UI Components
// Aligned with ui-ux-pro-max design intelligence (Accessibility, WCAG 2.2 AA, Micro-interactions)

import React, { useEffect } from 'react';

// Status Badge with Accessible Contrast & Pulse Animation
export const StatusBadge = ({ status }) => {
  const colors = {
    draft: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
    analyzing: 'bg-blue-500/20 text-blue-300 border-blue-500/35',
    planning: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35',
    ready: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/35',
    executing: 'bg-brand-500/25 text-brand-300 border-brand-500/40 shadow-glow-sm',
    monitoring: 'bg-purple-500/20 text-purple-300 border-purple-500/35',
    blocked: 'bg-amber-500/20 text-amber-300 border-amber-500/35',
    replanning: 'bg-orange-500/20 text-orange-300 border-orange-500/35',
    awaiting_approval: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 animate-pulse',
    completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35',
    failed: 'bg-red-500/20 text-red-300 border-red-500/35',
    pending: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    in_progress: 'bg-brand-500/20 text-brand-300 border-brand-500/35',
    active: 'bg-brand-500/20 text-brand-300 border-brand-500/35',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/35',
    idle: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
    approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35',
    rejected: 'bg-red-500/20 text-red-300 border-red-500/35',
  };

  const dots = {
    executing: 'bg-brand-400',
    monitoring: 'bg-purple-400',
    analyzing: 'bg-blue-400',
    planning: 'bg-indigo-400',
    replanning: 'bg-orange-400',
    in_progress: 'bg-brand-400',
    active: 'bg-brand-400',
    awaiting_approval: 'bg-yellow-400',
  };

  const hasAnimation = !!dots[status];
  const cls = colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  const label = status?.replace(/_/g, ' ') || 'unknown';

  return (
    <span
      role="status"
      aria-label={`Status: ${label}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border ${cls}`}
    >
      {hasAnimation && (
        <span className={`w-1.5 h-1.5 rounded-full animate-ping opacity-75 ${dots[status]}`} />
      )}
      {label}
    </span>
  );
};

// Priority Badge with Semantic Color Tokens
export const PriorityBadge = ({ priority }) => {
  const colors = {
    LOW: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/35',
    CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse',
  };
  const cls = colors[priority] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  return (
    <span
      role="status"
      aria-label={`Priority: ${priority}`}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border ${cls}`}
    >
      {priority === 'CRITICAL' && <span aria-hidden="true">⚠</span>}
      {priority}
    </span>
  );
};

// Loading Skeleton with Smooth Shimmer
export const Skeleton = ({ className = '' }) => (
  <div
    role="status"
    aria-label="Loading content..."
    className={`skeleton ${className}`}
  />
);

// High-Tech Dual-Tone Spinner
export const Spinner = ({ size = 20, className = '' }) => (
  <div
    role="status"
    aria-label="Loading"
    className={`border-2 border-brand-500/20 border-t-brand-400 rounded-full animate-spin ${className}`}
    style={{ width: size, height: size }}
  />
);

// Empty State with Engaging Visual Container
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-dark-850 border border-white/5 flex items-center justify-center mb-4 shadow-glass">
        <Icon size={28} className="text-brand-400" />
      </div>
    )}
    <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
    {description && <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">{description}</p>}
    {action}
  </div>
);

// Accessible Progress Bar
export const ProgressBar = ({ value, max = 100, label = 'Progress' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="progress-bar"
    >
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
};

// Health Score Gauge Ring
export const HealthScore = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      role="img"
      aria-label={`System health score: ${score} out of 100`}
      className="relative inline-flex items-center justify-center"
    >
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold font-heading text-white">{score}</div>
        <div className="text-[9px] font-mono text-gray-500">/100</div>
      </div>
    </div>
  );
};

// Confidence Indicator Bar
export const ConfidenceBar = ({ value }) => {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-brand-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`AI Confidence: ${pct}%`}
      className="flex items-center gap-2"
    >
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-medium text-gray-300">{pct}%</span>
    </div>
  );
};

// Accessible Modal Dialog with Keyboard Escape Listener
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative glass-card w-full ${sizes[size]} animate-fade-in border border-white/10 shadow-2xl z-10`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 id="modal-title" className="text-base font-bold text-white font-heading">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Accessible Confirmation Dialog
export const ConfirmDialog = ({ open, onConfirm, onCancel, title, message, confirmLabel = 'Confirm', danger = false }) => (
  <Modal open={open} onClose={onCancel} title={title} size="sm">
    <p className="text-gray-300 mb-6 text-sm leading-relaxed">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onCancel} className="btn-secondary text-xs py-2 px-4">Cancel</button>
      <button onClick={onConfirm} className={`${danger ? 'btn-danger' : 'btn-primary'} text-xs py-2 px-4`}>{confirmLabel}</button>
    </div>
  </Modal>
);
