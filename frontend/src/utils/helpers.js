// Status & Priority helpers
export const getStatusColor = (status) => {
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
    // Task statuses
    pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    in_progress: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
    active: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    idle: 'bg-gray-600/20 text-gray-500 border-gray-600/30',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

export const getPriorityColor = (priority) => {
  const colors = {
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[priority] || 'bg-gray-500/20 text-gray-400';
};

export const getAgentIcon = (agentName) => {
  const icons = {
    'Orchestrator': '🎯',
    'Analysis Agent': '🔍',
    'Task Planning Agent': '📋',
    'Coordination Agent': '🔗',
    'Execution Agent': '⚡',
    'Monitoring Agent': '👁',
    'Replanning Agent': '🔄',
    'Finance Agent': '💰',
    'Technical Agent': '🔧',
    'Support Agent': '🎧',
    'Operations Agent': '⚙️',
    'Manager Agent': '👔',
    'Backup Finance Agent': '💳',
    'Senior Technical Agent': '🛠',
    'Escalated Support Agent': '📞',
    'Senior Operations Agent': '🏗',
  };
  return icons[agentName] || '🤖';
};

export const getAgentColor = (agentName) => {
  const colors = {
    'Orchestrator': 'from-brand-500 to-purple-500',
    'Analysis Agent': 'from-blue-500 to-cyan-500',
    'Task Planning Agent': 'from-indigo-500 to-brand-500',
    'Coordination Agent': 'from-purple-500 to-pink-500',
    'Execution Agent': 'from-amber-500 to-orange-500',
    'Monitoring Agent': 'from-emerald-500 to-teal-500',
    'Replanning Agent': 'from-red-500 to-orange-500',
  };
  return colors[agentName] || 'from-gray-500 to-gray-600';
};

// Formatting
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// Health score color
export const getHealthColor = (score) => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

export const getHealthBg = (score) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

// Error message extraction
export const getErrorMessage = (error) => {
  return error?.response?.data?.error || error?.message || 'An unexpected error occurred';
};

// Truncate text
export const truncate = (text, len = 100) => {
  if (!text) return '';
  return text.length > len ? text.substring(0, len) + '...' : text;
};

export const formatRelativeTime = (dateStr) => {
  return timeAgo(dateStr);
};

export const TASK_STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  blocked: 'Blocked',
};

export const AGENT_METADATA = {
  'Orchestrator': {
    name: 'Orchestrator',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: '🎯',
    desc: 'Central governor directing multi-agent coordination and state machines.',
  },
  'Analysis Agent': {
    name: 'Analysis Agent',
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: '🔍',
    desc: 'Gemini reasoning for problem classification and severity determination.',
  },
  'Task Planning Agent': {
    name: 'Task Planning Agent',
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    icon: '📋',
    desc: 'Decomposes complex problems into atomic DAG task structures.',
  },
  'Coordination Agent': {
    name: 'Coordination Agent',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: '🔗',
    desc: 'Delegates and balances task execution queues across agent fleet.',
  },
  'Execution Agent': {
    name: 'Execution Agent',
    color: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    icon: '⚡',
    desc: 'Executes simulated actions and records operational results.',
  },
  'Monitoring Agent': {
    name: 'Monitoring Agent',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: '👁',
    desc: 'Watches telemetry and detects task delays or failure exceptions.',
  },
  'Replanning Agent': {
    name: 'Replanning Agent',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: '🔄',
    desc: 'Dynamic adaptation and contingency route generator.',
  },
};

export const getAgentInfo = (agentName) => {
  if (!agentName) return { name: 'Unassigned', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: '🤖', desc: 'Awaiting assignment' };
  return AGENT_METADATA[agentName] || {
    name: agentName,
    color: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    icon: getAgentIcon(agentName),
    desc: 'Autonomous agent subsystem'
  };
};

