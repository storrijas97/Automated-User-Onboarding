const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const employeesRouter = require('./routes/employees');
const tasksRouter = require('./routes/tasks');
const mappingsRouter = require('./routes/mappings');
const auditRouter = require('./routes/audit');
const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');
const accessRequestsRouter = require('./routes/access_requests');
const configRouter = require('./routes/config');
const notificationsRouter = require('./routes/notifications');
const syncRouter = require('./routes/sync');

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/mappings', mappingsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/access-requests', accessRequestsRouter);
app.use('/api/config', configRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/sync', syncRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
