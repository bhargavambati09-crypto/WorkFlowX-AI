const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const workflowRoutes = require('./routes/workflows');
const taskRoutes = require('./routes/tasks');
const approvalRoutes = require('./routes/approvals');
const analyticsRoutes = require('./routes/analytics');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  /\.netlify\.app$/,
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser requests
    const allowed = allowedOrigins.some(o => 
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(null, allowed);
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' } });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: 'AI rate limit exceeded. Please wait.' } });
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'WorkFlowX AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Centralized error handler
app.use(errorHandler);

// Robust process-level error safety to prevent unexpected server terminations
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection Caught]:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception Caught]:', err?.message || err);
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║     WorkFlowX AI Backend Server          ║
║     Port: ${PORT}                             ║
║     Status: Running                      ║
║     Understand. Plan. Delegate. Execute. ║
╚══════════════════════════════════════════╝`);
});

module.exports = app;
