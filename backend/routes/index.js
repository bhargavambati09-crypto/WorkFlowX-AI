const express = require('express');
const authRoutes = require('./auth');
const workflowRoutes = require('./workflows');
const taskRoutes = require('./tasks');
const approvalRoutes = require('./approvals');
const analyticsRoutes = require('./analytics');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/workflows', workflowRoutes);
router.use('/tasks', taskRoutes);
router.use('/approvals', approvalRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
module.exports.authRoutes = authRoutes;
module.exports.workflowRoutes = workflowRoutes;
module.exports.taskRoutes = taskRoutes;
module.exports.approvalRoutes = approvalRoutes;
module.exports.analyticsRoutes = analyticsRoutes;
