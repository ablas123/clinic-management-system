// ===========================================
// 🏥 CLINIC MANAGEMENT SYSTEM - EXPRESS APP CONFIG
// ===========================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 🔑 TRUST PROXY FOR RENDER (مهم جداً)
app.set('trust proxy', 1);

// ===========================================
// 🔒 SECURITY MIDDLEWARE
// ===========================================

app.use(helmet());

app.use(cors({
  origin: true, // ✅ يقبل جميع المصادر أثناء التطوير
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipFailedRequests: true,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ===========================================
// 📦 BODY PARSERS
// ===========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// 🏥 API ROUTES
// ===========================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Clinic API is running 🩺',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Clinic Management System API',
    version: '1.0.0',
    modules: {
      auth: '/api/auth',
      patients: '/api/patients',
      doctors: '/api/doctors',
      appointments: '/api/appointments',
      invoices: '/api/invoices',
      laboratory: '/api/lab'
    },
    healthCheck: '/api/health'
  });
});

// ⚡ ROUTES
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const patientRoutes = require('./routes/patientRoutes');
app.use('/api/patients', patientRoutes);

const doctorRoutes = require('./routes/doctorRoutes');
app.use('/api/doctors', doctorRoutes);

const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

const invoiceRoutes = require('./routes/invoiceRoutes');
app.use('/api/invoices', invoiceRoutes);

const labRoutes = require('./routes/labRoutes');
app.use('/api/lab', labRoutes);

// ===========================================
// ❌ ERROR HANDLING
// ===========================================

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'NOT_FOUND'
  });
});

app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  
  // تجاهل أخطاء البروكسي البسيطة
  if (err.code === 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR') {
    console.warn('⚠️ Proxy header warning (non-critical)');
    return next();
  }
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'SERVER_ERROR'
  });
});

module.exports = app;
