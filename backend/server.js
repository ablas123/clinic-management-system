// ===========================================
// 🏥 CLINIC MANAGEMENT SYSTEM - SERVER ENTRY POINT
// ===========================================

require('dotenv').config();
const app = require('./src/app');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Server Port
const PORT = process.env.PORT || 5000;

// ===========================================
// 🚀 START SERVER
// ===========================================

async function startServer() {
  try {
    // Connect to Database
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL via Neon');
    
    // Start HTTP Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 Clinic API: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    
    // Close Prisma connection on error
    await prisma.$disconnect();
    process.exit(1);
  }
}

// ===========================================
// 🛑 GRACEFUL SHUTDOWN
// ===========================================

// Handle SIGTERM (Render/Heroku shutdown signal)
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught Exception:', error);
  await prisma.$disconnect();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  await prisma.$disconnect();
  process.exit(1);
});

// Start the server
startServer();
