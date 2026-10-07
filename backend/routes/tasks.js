const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getTasks, getTask, updateTask } = require('../controllers/taskController');

router.use(authMiddleware);
router.get('/', getTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);

module.exports = router;
