const { generateJSON } = require('../services/aiService');

/**
 * Analysis Agent - Analyzes business problems and returns structured intelligence
 */
const analysisAgent = async (problem, context = {}) => {
  const prompt = `You are the Analysis Agent of WorkFlowX AI, an enterprise autonomous workflow intelligence system.

Your task is to analyze the following business problem and return a comprehensive, structured analysis.

BUSINESS PROBLEM:
Title: ${context.title || 'Business Issue'}
Description: ${problem}
Department: ${context.department || 'General'}
Submitted At: ${new Date().toISOString()}

You MUST return a JSON object with EXACTLY this structure (no markdown, no explanation, just JSON):
{
  "summary": "2-3 sentence concise summary of the core problem",
  "category": "One of: Payment Issue, Technical Issue, Operational Issue, HR Issue, Customer Service Issue, Security Issue, Compliance Issue, Supply Chain Issue",
  "priority": "One of: LOW, MEDIUM, HIGH, CRITICAL",
  "priorityReason": "1-2 sentence explanation of why this priority was assigned",
  "impact": "One of: LOW, MEDIUM, HIGH, CRITICAL",
  "impactReason": "1-2 sentence explanation of business impact",
  "confidence": 0.0 to 1.0 as a number,
  "departments": ["array", "of", "affected", "departments"],
  "recommendedActions": ["array", "of", "specific", "actionable", "recommendations"],
  "missingInformation": ["any", "missing", "info", "needed"],
  "estimatedResolutionTime": "estimated time like '2-4 hours' or '1-2 days'",
  "requiresHumanApproval": true or false,
  "approvalReason": "reason if requiresHumanApproval is true, empty string otherwise",
  "riskLevel": "One of: LOW, MEDIUM, HIGH, CRITICAL",
  "affectedUsers": "estimate like '1 user' or '100+ customers'"
}

Base your analysis on:
- Financial risk (payment amounts, refunds, losses)
- Customer impact (complaints, churn risk, reputation)
- Technical complexity (system failures, data integrity)
- Regulatory risk (compliance, legal exposure)
- Time sensitivity (deadline, SLA breach)

Assign HIGH or CRITICAL priority if there are financial implications, system outages, or significant customer impact.`;

  try {
    const result = await generateJSON(prompt);
    
    // Validate and sanitize required fields
    return {
      summary: result.summary || 'Problem analyzed successfully',
      category: result.category || 'Operational Issue',
      priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(result.priority) ? result.priority : 'MEDIUM',
      priorityReason: result.priorityReason || 'Standard priority assessment',
      impact: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(result.impact) ? result.impact : 'MEDIUM',
      impactReason: result.impactReason || 'Standard impact assessment',
      confidence: typeof result.confidence === 'number' ? Math.min(1, Math.max(0, result.confidence)) : 0.85,
      departments: Array.isArray(result.departments) ? result.departments : ['Operations'],
      recommendedActions: Array.isArray(result.recommendedActions) ? result.recommendedActions : ['Review and address the issue'],
      missingInformation: Array.isArray(result.missingInformation) ? result.missingInformation : [],
      estimatedResolutionTime: result.estimatedResolutionTime || '2-4 hours',
      requiresHumanApproval: Boolean(result.requiresHumanApproval),
      approvalReason: result.approvalReason || '',
      riskLevel: result.riskLevel || 'MEDIUM',
      affectedUsers: result.affectedUsers || 'Unknown',
    };
  } catch (error) {
    console.error('Analysis Agent error:', error.message);
    // Return a fallback analysis
    return {
      summary: `Analysis of: ${problem.substring(0, 100)}...`,
      category: 'Operational Issue',
      priority: 'HIGH',
      priorityReason: 'Default high priority due to analysis failure - requires manual review',
      impact: 'MEDIUM',
      impactReason: 'Impact requires manual assessment',
      confidence: 0.5,
      departments: ['Operations', 'Management'],
      recommendedActions: ['Manual review required', 'Escalate to operations team', 'Document the issue'],
      missingInformation: ['AI analysis temporarily unavailable'],
      estimatedResolutionTime: '2-4 hours',
      requiresHumanApproval: true,
      approvalReason: 'Manual review required as AI analysis encountered an error',
      riskLevel: 'MEDIUM',
      affectedUsers: 'Unknown',
    };
  }
};

module.exports = analysisAgent;
