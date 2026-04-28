require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const masterRoutes = require('./routes/master');
const yarnRoutes = require('./routes/yarn');
const knittingRoutes = require('./routes/knitting');
const dyeingRoutes = require('./routes/dyeing');
const compactingRoutes = require('./routes/compacting');
const inhouseFabricRoutes = require('./routes/inhouseFabric');
const searchRoutes = require('./routes/search');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/yarn', yarnRoutes);
app.use('/api/knitting', knittingRoutes);
app.use('/api/dyeing', dyeingRoutes);
app.use('/api/compacting', compactingRoutes);
app.use('/api/inhouse-fabric', inhouseFabricRoutes);
app.use('/api/fabric-purchase', inhouseFabricRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─────────────────────────────────────────────────
// Error Handler (must be last)
// ─────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DB_PROVIDER} — ${process.env.NODE_ENV}`);
});

module.exports = app;
