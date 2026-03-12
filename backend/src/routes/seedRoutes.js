// ===========================================
// 🌱 SEED ROUTES (Development Only)
// ===========================================
// File: backend/src/routes/seedRoutes.js
// Description: Creates initial admin user and sample lab tests

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// POST /api/seed/run - Run database seed (Development only)
router.post('/run', async (req, res) => {
  try {
    console.log('🌱 Starting database seed...');

    // 1. Create Admin User
    const adminEmail = 'admin@clinic.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      await prisma.user.create({
        data: {  // ✅ تم إضافة data: هنا
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // 2. Create Sample Lab Tests
    const sampleTests = [
      {
        name: 'CBC - Complete Blood Count',
        code: 'CBC',
        category: 'Blood',
        description: 'فحص تعداد الدم الكامل',
        price: 150.00,
        unit: 'cells/μL',
        referenceRange: 'Varies by component',
        isFasting: false,
        turnaroundTime: 24,
        fields: [
          { name: 'Hemoglobin', unit: 'g/dL', min: 12, max: 16 },
          { name: 'WBC', unit: 'cells/μL', min: 4.5, max: 11 },
          { name: 'RBC', unit: 'million/μL', min: 4.5, max: 5.5 }
        ]
      },
      {
        name: 'Lipid Profile',
        code: 'LIPID',
        category: 'Blood',
        description: 'فحص دهون الدم',
        price: 200.00,
        unit: 'mg/dL',
        referenceRange: 'Varies by component',
        isFasting: true,
        turnaroundTime: 24,
        fields: [
          { name: 'Total Cholesterol', unit: 'mg/dL', min: 0, max: 200 },
          { name: 'HDL', unit: 'mg/dL', min: 40, max: 60 },
          { name: 'LDL', unit: 'mg/dL', min: 0, max: 100 }
        ]
      },
      {
        name: 'HbA1c - Glycated Hemoglobin',
        code: 'HBA1C',
        category: 'Blood',
        description: 'فحص السكري التراكمي',
        price: 180.00,
        unit: '%',
        referenceRange: '4-5.6',
        isFasting: false,
        turnaroundTime: 24,
        fields: [
          { name: 'HbA1c', unit: '%', min: 4, max: 5.6 }
        ]
      },
      {
        name: 'Urinalysis',
        code: 'URINE',
        category: 'Urine',
        description: 'فحص البول الكامل',
        price: 100.00,
        unit: 'various',
        referenceRange: 'Varies',
        isFasting: false,
        turnaroundTime: 12,
        fields: [
          { name: 'pH', unit: 'pH', min: 4.5, max: 8 },
          { name: 'Glucose', unit: 'mg/dL', min: 0, max: 15 }
        ]
      },
      {
        name: 'X-Ray Chest',
        code: 'XRAY-CHEST',
        category: 'X-Ray',
        description: 'أشعة سينية على الصدر',
        price: 300.00,
        unit: 'image',
        referenceRange: 'N/A',
        isFasting: false,
        turnaroundTime: 48,
        fields: null
      }
    ];

    for (const test of sampleTests) {
      const existing = await prisma.labTest.findUnique({
        where: { code: test.code }
      });

      if (!existing) {
        await prisma.labTest.create({
          data: test  // ✅ تم إضافة data: هنا
        });
        console.log(`✅ Lab test created: ${test.code}`);
      } else {
        console.log(`ℹ️ Lab test exists: ${test.code}`);
      }
    }

    console.log('🎉 Database seed completed!');
    
    res.json({ 
      success: true, 
      message: '🌱 Seed completed: admin + 5 lab tests created' 
    });

  } catch (e) {
    console.error('❌ Seed error:', e);
    res.status(500).json({ 
      success: false, 
      error: e.message,
      hint: 'Check syntax: all prisma.create() calls need { data: {...} }'
    });
  }
});

module.exports = router; 
