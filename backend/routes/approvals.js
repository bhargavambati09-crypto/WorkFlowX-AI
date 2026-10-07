const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getApprovals, approveAction, rejectAction } = require('../controllers/approvalController');

router.use(authMiddleware);
router.get('/', getApprovals);
router.post('/:id/approve', approveAction);
router.post('/:id/reject', rejectAction);

module.exports = router;
