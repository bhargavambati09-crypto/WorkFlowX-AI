const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getWorkflows, createWorkflow, getWorkflow, updateWorkflow, deleteWorkflow,
  analyzeWorkflow, startWorkflow, simulateFailure, replanWorkflow,
  getWorkflowAgents, getWorkflowEvents, getWorkflowHealth,
  askWorkflowQuestion, completeWorkflow, createDemoWorkflow,
} = require('../controllers/workflowController');

router.use(authMiddleware);

router.get('/', getWorkflows);
router.post('/', createWorkflow);
router.post('/demo', createDemoWorkflow);
router.get('/:id', getWorkflow);
router.put('/:id', updateWorkflow);
router.delete('/:id', deleteWorkflow);

// AI routes
router.post('/:id/analyze', analyzeWorkflow);
router.post('/:id/start', startWorkflow);
router.post('/:id/simulate-failure', simulateFailure);
router.post('/:id/replan', replanWorkflow);
router.post('/:id/complete', completeWorkflow);
router.post('/:id/ask', askWorkflowQuestion);

// Data routes
router.get('/:id/agents', getWorkflowAgents);
router.get('/:id/events', getWorkflowEvents);
router.get('/:id/health', getWorkflowHealth);

module.exports = router;
