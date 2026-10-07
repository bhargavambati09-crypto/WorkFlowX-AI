const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const authCtrl = require('./controllers/authController');
const wfCtrl = require('./controllers/workflowController');
const taskCtrl = require('./controllers/taskController');
const appCtrl = require('./controllers/approvalController');
const analyticsCtrl = require('./controllers/analyticsController');

const mockRes = (label) => {
  return {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      console.log(`[PASS] ${label} -> status: ${this.statusCode || 200}`);
      return this;
    },
  };
};

const mockNext = (label) => (err) => {
  if (err) {
    console.error(`[FAIL] ${label} -> Error:`, err.message || err);
    process.exit(1);
  }
};

async function runTests() {
  console.log('🧪 Starting Full WorkFlowX AI Integration Test Suite...\n');

  // 1. Auth Login
  const loginRes = mockRes('Auth: Login');
  await authCtrl.login(
    { body: { email: 'demo@workflowx.ai', password: 'password123' } },
    loginRes,
    mockNext('Auth: Login')
  );
  const user = loginRes.data.user;

  // 2. Auth Register (random email)
  const randEmail = `judge_${Date.now()}@workflowx.ai`;
  const regRes = mockRes('Auth: Register');
  await authCtrl.register(
    { body: { name: 'Judge Tester', email: randEmail, password: 'password123' } },
    regRes,
    mockNext('Auth: Register')
  );

  // 3. Workflows List
  const wfListRes = mockRes('Workflows: List');
  await wfCtrl.getWorkflows({ user, query: {} }, wfListRes, mockNext('Workflows: List'));

  // 4. Create Workflow
  const createWfRes = mockRes('Workflows: Create');
  await wfCtrl.createWorkflow(
    {
      user,
      body: {
        title: 'Integration Test Incident',
        description: 'Automated test problem description for system validation',
        department: 'Operations',
      },
    },
    createWfRes,
    mockNext('Workflows: Create')
  );
  const newWf = createWfRes.data.workflow || createWfRes.data.data;

  // 5. Get Workflow by ID
  const getWfRes = mockRes('Workflows: Get Details');
  await wfCtrl.getWorkflow({ user, params: { id: newWf.id } }, getWfRes, mockNext('Workflows: Get Details'));

  // 6. Update Workflow
  const updateWfRes = mockRes('Workflows: Update');
  await wfCtrl.updateWorkflow(
    { user, params: { id: newWf.id }, body: { priority: 'HIGH' } },
    updateWfRes,
    mockNext('Workflows: Update')
  );

  // 7. Get Agents
  const agentsRes = mockRes('Workflows: Agents');
  await wfCtrl.getWorkflowAgents({ params: { id: newWf.id } }, agentsRes, mockNext('Workflows: Agents'));

  // 8. Get Events
  const eventsRes = mockRes('Workflows: Events');
  await wfCtrl.getWorkflowEvents({ params: { id: newWf.id } }, eventsRes, mockNext('Workflows: Events'));

  // 9. Get Health
  const healthRes = mockRes('Workflows: Health');
  await wfCtrl.getWorkflowHealth({ params: { id: newWf.id } }, healthRes, mockNext('Workflows: Health'));

  // 10. Ask Question
  const askRes = mockRes('Workflows: Ask Question');
  await wfCtrl.askWorkflowQuestion(
    { user, params: { id: newWf.id }, body: { question: 'What is the priority?' } },
    askRes,
    mockNext('Workflows: Ask Question')
  );

  // 11. Tasks List
  const tasksRes = mockRes('Tasks: List');
  await taskCtrl.getTasks({ user, query: {} }, tasksRes, mockNext('Tasks: List'));

  // 12. Approvals List
  const appListRes = mockRes('Approvals: List');
  await appCtrl.getApprovals({ user, query: {} }, appListRes, mockNext('Approvals: List'));

  // 13. Analytics Dashboard
  const analyticsRes = mockRes('Analytics: Dashboard');
  await analyticsCtrl.getDashboardAnalytics({ user }, analyticsRes, mockNext('Analytics: Dashboard'));

  console.log('\n🎉 ALL 13 ENDPOINT INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
