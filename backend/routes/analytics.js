const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getDashboardAnalytics } = require('../controllers/analyticsController');

router.use(authMiddleware);
router.get('/dashboard', getDashboardAnalytics);

module.exports = router;
