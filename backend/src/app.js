// ===========================================
// 🏥 CLINIC MANAGEMENT SYSTEM - EXPRESS APP CONFIG
// ===========================================
// File: backend/src/app.js
// Description: Main Express application configuration

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ===========================================
// 🔑 RENDER PROXY CONFIGURATION (مهم جداً)
// ===========================================
// يجب تفعيل هذا السطر ليعمل Rate Limiting و IP Tracking بشكل صحيح خلف بروكسي Render
app.set('trust proxy', 1);

// ===========================================
// 🔒 SECURITY & CORS MIDDLEWARE
// ===========================================

// 1. Helmet: يضيف ترويسات أمان HTTP لحماية الخادم
app.use(helmet());

// 2. CORS: يسمح للواجهات الأمامية بالاتصال بالخادم
// ملاحظة: origin: true يقبل جميع المصادر أثناء التطوير
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate Limiting: يحد من عدد الطلبات لمنع الهجمات
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // حد أقصى 100 طلب لكل عنوان IP في النافذة الزمنية
  skipFailedRequests: true, // لا تحسب الطلبات الفاشلة ضمن الحد
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ===========================================
// 📦 BODY PARSERS
// ===========================================
// لمعالجة بيانات JSON و Form في الطلبات
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// 🏥 API ROUTES
// ===========================================

// 1. Health Check Endpoint (للمراقبة و Uptime Robot)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Clinic API is running 🩺',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 2. Root Endpoint (صفحة الترحيب بالمطورين)
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
      laboratory: '/api/lab',
      seed: '/api/seed (development only)'
    },
    healthCheck: '/api/health',
    documentation: 'https://github.com/yourname/clinic-management-system'
  });
});

// ⚡ ROUTES IMPORTS & MOUNTING

// 🔐 Authentication Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 👤 Patient Routes
const patientRoutes = require('./routes/patientRoutes');
app.use('/api/patients', patientRoutes);

// 👨‍⚕️ Doctor Routes
const doctorRoutes = require('./routes/doctorRoutes');
app.use('/api/doctors', doctorRoutes);

// 📅 Appointment Routes
const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

// 💰 Invoice Routes
const invoiceRoutes = require('./routes/invoiceRoutes');
app.use('/api/invoices', invoiceRoutes);

// 🧪 Laboratory Routes
const labRoutes = require('./routes/labRoutes');
app.use('/api/lab', labRoutes);

// 🌱 Seed Routes (لإنشاء البيانات الأولية - للتطوير فقط)
// ⚠️ ينصح بإزالة هذا المسار في بيئة الإنتاج الحقيقية أو حمايته بكلمة سر
const seedRoutes = require('./routes/seedRoutes');
app.use('/api/seed', seedRoutes);

// ===========================================
// ❌ ERROR HANDLING
// ===========================================

// 404 Handler: لأي رابط غير موجود
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'NOT_FOUND'
  });
});

// Global Error Handler: لالتقاط أي خطأ يحدث في التطبيق
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  
  // التعامل مع أخطاء بروكسي Render (غير حرجة)
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

// ===========================================
// 📤 EXPORT APP
// ===========================================
module.exports = app; 
