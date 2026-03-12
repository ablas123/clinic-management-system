// ===========================================
// 🏥 CLINIC MANAGEMENT SYSTEM - EXPRESS APP CONFIG
// ===========================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ===========================================
// 🔒 SECURITY MIDDLEWARE
// ===========================================

// 1. Helmet: Sets security HTTP headers
app.use(helmet());

// 2. CORS: Allows frontend to communicate with backend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate Limiting: Prevents DDoS and brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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

// Health Check Endpoint (For monitoring)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Clinic API is running 🩺',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Clinic Management System API',
    version: '1.0.0'
  });
});

// ⚠️ Feature Routes (Will be added in next steps)
// const authRoutes = require('./routes/authRoutes');
// const patientRoutes = require('./routes/patientRoutes');
// const appointmentRoutes = require('./routes/appointmentRoutes');
// const doctorRoutes = require('./routes/doctorRoutes');
// const invoiceRoutes = require('./routes/invoiceRoutes');

// app.use('/api/auth', authRoutes);
// app.use('/api/patients', patientRoutes);
// app.use('/api/appointments', appointmentRoutes);
// app.use('/api/doctors', doctorRoutes);
// app.use('/api/invoices', invoiceRoutes');

// ===========================================
// ❌ ERROR HANDLING
// ===========================================

// 404 Handler (Route not found)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'NOT_FOUND'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'SERVER_ERROR'
  });
});

// ===========================================
// 📤 EXPORT APP
// ===========================================

module.exports = app;
