/**
 * WorkFlowX AI - Centralized Structured Logger
 * Provides formatted telemetry, agent status tags, and execution timestamps
 */

const formatTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[INFO] [${formatTimestamp()}] ${message}`, Object.keys(meta).length ? meta : '');
    }
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] [${formatTimestamp()}] ⚠ ${message}`, Object.keys(meta).length ? meta : '');
  },
  error: (message, error = null) => {
    console.error(`[ERROR] [${formatTimestamp()}] ✖ ${message}`, error?.message || error || '');
  },
  agent: (agentName, action, confidence = null) => {
    const confStr = confidence !== null ? ` (confidence: ${Math.round(confidence * 100)}%)` : '';
    console.log(`[AGENT] [${formatTimestamp()}] [${agentName}] -> ${action}${confStr}`);
  },
};

module.exports = logger;
