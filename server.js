// ============================================================
// server.js — DairyPro Backend Entry Point
// ============================================================
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/cattle',    require('./routes/cattle.routes'));
app.use('/api/milk',      require('./routes/milk.routes'));
app.use('/api/sales',     require('./routes/sales.routes'));
app.use('/api/revenue',   require('./routes/revenue.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: '🐄 DairyPro API is running!' });
});

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  DairyPro API running on http://localhost:${PORT}`);
});
