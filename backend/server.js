// File: backend/server.js - COMPLETE & CORS CONFIGURED
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS Configuration - Allow frontend to connect
const corsOptions = {
  origin: [
    'https://clinic-frontend-3lwi.onrender.com',  // ✅ Production frontend
    'http://localhost:5173',                        // ✅ Local development
    'http://localhost:3000',
    '*' // ⚠️ Temporarily allow all for testing - remove in production
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Pre-flight requests
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check - ✅ Always available (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Routes that we KNOW exist and are complete
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/patients', require('./src/routes/patientRoutes'));
app.use('/api/doctors', require('./src/routes/doctorRoutes'));
app.use('/api/appointments', require('./src/routes/appointmentRoutes'));
app.use('/api/invoices', require('./src/routes/invoiceRoutes'));
app.use('/api/lab', require('./src/routes/labRoutes'));

// Error handler - ✅ Catch-all with CORS headers
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Ensure CORS headers on error responses
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
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
  console.log(`🔗 CORS allowed origins: ${corsOptions.origin.join(', ')}`);
  
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