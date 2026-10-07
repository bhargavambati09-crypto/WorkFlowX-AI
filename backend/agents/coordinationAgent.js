const { generateJSON } = require('../services/aiService');

/**
 * Coordination Agent - Determines optimal agent assignment for tasks
 */
const coordinationAgent = async (tasks, analysis) => {
  const agentCapabilities = {
    'Finance Agent': ['payment', 'refund', 'financial', 'billing', 'transaction', 'invoice', 'audit', 'account', 'money', 'charge', 'fee'],
    'Technical Agent': ['system', 'error', 'bug', 'integration', 'api', 'database', 'server', 'network', 'code', 'debug', 'technical', 'software', 'hardware'],
    'Support Agent': ['customer', 'complaint', 'ticket', 'email', 'communication', 'notify', 'response', 'feedback', 'service', 'help', 'resolve'],
    'Operations Agent': ['process', 'logistics', 'coordinate', 'workflow', 'procedure', 'document', 'report', 'monitor', 'track', 'investigate', 'assess'],
    'Manager Agent': ['escalat', 'approv', 'decision', 'review', 'authorize', 'high-level', 'stakeholder', 'executive', 'strategy', 'priority'],
  };

  const assignments = tasks.map(task => {
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    let bestAgent = task.assignedAgent || 'Operations Agent';
    let highestScore = 0;
    
    for (const [agent, keywords] of Object.entries(agentCapabilities)) {
      const score = keywords.filter(kw => taskText.includes(kw)).length;
      if (score > highestScore) {
        highestScore = score;
        bestAgent = agent;
      }
    }

    return {
      taskTitle: task.title,
      recommendedAgent: bestAgent,
      originalAgent: task.assignedAgent,
      confidence: Math.min(0.95, 0.6 + (highestScore * 0.1)),
      reasoning: `Task content aligns with ${bestAgent}'s specialization`,
    };
  });

  return assignments;
};

module.exports = coordinationAgent;
