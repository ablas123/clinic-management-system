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
  origin: [
    'https://clinic-frontend-3lwi.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
// 🌱 SEED USERS (Development Only - RUN_SEED=true)
// ===========================================
if (process.env.RUN_SEED === 'true') {
  console.log('🌱 Running seed script to create test users...');
  
  const bcrypt = require('bcryptjs');
  
  async function hashPassword(pwd) {
    return await bcrypt.hash(pwd, 10);
  }
  
  async function seedUsers() {
    try {
      // 1. Admin
      const admin = await prisma.user.upsert({
        where: { email: 'admin@clinic.com' },
        update: {},
        create: {
          email: 'admin@clinic.com',
          password: await hashPassword('Admin@123'),
          firstName: 'مدير',
          lastName: 'النظام',
          phone: '0500000001',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      console.log('✅ Admin created');

      // 2. Doctor
      const doctorUser = await prisma.user.upsert({
        where: { email: 'doctor@clinic.com' },
        update: {},
        create: {
          email: 'doctor@clinic.com',
          password: await hashPassword('Doctor@123'),
          firstName: 'د. محمد',
          lastName: 'الأحمد',
          phone: '0500000002',
          role: 'DOCTOR',
          status: 'ACTIVE'
        }
      });
      const doctorConfig = {
        data: {
          userId: doctorUser.id,
          specialty: 'طب عام',
          licenseNumber: 'DOC001',
          bio: 'طبيب عام متخصص',
          consultationFee: 150.00,
          maxPatientsPerDay: 20
        }
      };
      await prisma.doctor.create(doctorConfig);
      console.log('✅ Doctor created');

      // 3. Lab Tech
      const labUser = await prisma.user.upsert({
        where: { email: 'lab@clinic.com' },
        update: {},
        create: {
          email: 'lab@clinic.com',
          password: await hashPassword('Lab@123'),
          firstName: 'أحمد',
          lastName: 'المعمل',
          phone: '0500000003',
          role: 'LAB_TECH',
          status: 'ACTIVE'
        }
      });
      const labConfig = {
        data: {
          userId: labUser.id,
          licenseNumber: 'LAB001',
          specialization: 'تحاليل دم'
        }
      };
      await prisma.labTechnician.create(labConfig);
      console.log('✅ Lab Tech created');

      // 4. Receptionist
      await prisma.user.upsert({
        where: { email: 'reception@clinic.com' },
        update: {},
        create: {
          email: 'reception@clinic.com',
          password: await hashPassword('Reception@123'),
          firstName: 'سارة',
          lastName: 'الاستقبال',
          phone: '0500000004',
          role: 'RECEPTIONIST',
          status: 'ACTIVE'
        }
      });
      console.log('✅ Receptionist created');

      console.log('🎉 All test users created successfully!');
    } catch (e) {
      console.error('❌ Seed error:', e);
    }
  }
  
  // Run seed after server starts
  setTimeout(() => {
    seedUsers().finally(() => {
      console.log('🌱 Seed script completed');
    });
  }, 3000);
}

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
