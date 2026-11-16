const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { errorHandler, notFound } = require('./core/middleware/errorHandler');

// Modular Monolith Routes
const authRoutes = require('./modules/auth/auth.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const memberRoutes = require('./modules/members/member.routes');
const programRoutes = require('./modules/programs/program.routes');
const groupRoutes = require('./modules/groups/group.routes');
const enrollmentRoutes = require('./modules/groups/enrollment.routes');
const staffRoutes = require('./modules/staff/staff.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const feeRoutes = require('./modules/fees/fee.routes');
const reportRoutes = require('./modules/reports/report.routes');
const settingsRoutes = require('./modules/settings/settings.routes');

const app = express();

// ── Security & Middleware ──
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow local development origins and tools without origin header (Postman, curl)
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Static uploads ──
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health check (public) ──
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Modular Domain API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// ── Error handling ──
app.use(notFound);
app.use(errorHandler);

module.exports = app;
