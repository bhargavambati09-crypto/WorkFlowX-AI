const analysisAgent = require('./analysisAgent');
const planningAgent = require('./planningAgent');
const coordinationAgent = require('./coordinationAgent');
const { executionAgent, logAgentActivity } = require('./executionAgent');
const { monitoringAgent, calculateHealthScore } = require('./monitoringAgent');
const replanningAgent = require('./replanningAgent');

module.exports = {
  analysisAgent,
  planningAgent,
  coordinationAgent,
  executionAgent,
  monitoringAgent,
  replanningAgent,
  logAgentActivity,
  calculateHealthScore,
  checkWorkflowSLA: monitoringAgent,
};
