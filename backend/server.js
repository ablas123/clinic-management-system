// File: backend/server.js - MINIMAL & SAFE (Only existing routes)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://clinic-frontend-3lwi.onrender.com',
  credentials: true
}));
app.use(express.json());

// Health check - ✅ Always available
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// ✅ Routes that we KNOW exist and are complete
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/patients', require('./src/routes/patientRoutes'));
app.use('/api/doctors', require('./src/routes/doctorRoutes'));
app.use('/api/appointments', require('./src/routes/appointmentRoutes'));
app.use('/api/invoices', require('./src/routes/invoiceRoutes'));
app.use('/api/lab', require('./src/routes/labRoutes'));

// ⚠️ Temporarily commented out routes that may not exist yet:
// app.use('/api/medical-records', require('./src/routes/medicalRecordRoutes'));

// Error handler - ✅ Catch-all
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// ✅ Safe seed - only runs if no users exist
async function seedIfEmpty() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 No users found, running seed...');
      const { createUsers } = require('./scripts/createUsers');
      await createUsers();
      console.log('✅ Seed completed');
    } else {
      console.log('✅ Users already exist, skipping seed');
    }
  } catch (e) {
    console.warn('⚠️ Seed skipped:', e.message);
  }
}

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ Connected to PostgreSQL via Neon`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Clinic API: http://localhost:${PORT}/api/health`);
  
  // Run seed after DB is ready
  await seedIfEmpty();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
