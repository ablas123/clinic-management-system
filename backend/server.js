require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// ===========================================
// 🛡️ MIDDLEWARE
// ===========================================
app.use(cors({
  origin: ['https://clinic-frontend-3lwi.onrender.com', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===========================================
// 📝 REQUEST LOGGING
// ===========================================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===========================================
// 🏥 HEALTH CHECK
// ===========================================
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      success: true, 
      message: 'Server is running', 
      timestamp: new Date().toISOString() 
    });
  } catch (e) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: e.message 
    });
  }
});

// ===========================================
// 🔐 AUTH ROUTES
// ===========================================
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// ===========================================
// 👥 PATIENT ROUTES
// ===========================================
const patientRoutes = require('./src/routes/patientRoutes');
app.use('/api/patients', patientRoutes);

// ===========================================
// 👨‍⚕️ DOCTOR ROUTES
// ===========================================
const doctorRoutes = require('./src/routes/doctorRoutes');
app.use('/api/doctors', doctorRoutes);

// ===========================================
// 📅 APPOINTMENT ROUTES
// ===========================================
const appointmentRoutes = require('./src/routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

// ===========================================
// 💰 INVOICE ROUTES
// ===========================================
const invoiceRoutes = require('./src/routes/invoiceRoutes');
app.use('/api/invoices', invoiceRoutes);

// ===========================================
// 🧪 LAB ROUTES
// ===========================================
const labRoutes = require('./src/routes/labRoutes');
app.use('/api/lab', labRoutes);

// ===========================================
// ❌ 404 HANDLER
// ===========================================
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// ===========================================
// 🛑 ERROR HANDLER
// ===========================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal server error' 
  });
});

// ===========================================
// 🚀 START SERVER
// ===========================================
app.listen(PORT, () => {
  console.log('✅ Connected to PostgreSQL via Neon');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Clinic API: http://localhost:${PORT}/api/health`);
});

// ===========================================
// 🛑 GRACEFUL SHUTDOWN
// ===========================================
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
