const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, updateMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);

module.exports = router;
