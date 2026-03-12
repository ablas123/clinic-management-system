const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// POST /api/seed/run - تشغيل البذرة (للتطوير فقط)
router.post('/run', async (req, res) => {
  try {
    // 1. إنشاء Admin
    const adminEmail = 'admin@clinic.com';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await prisma.user.create({
         { email: adminEmail, password: hashedPassword, role: 'ADMIN' }
      });
      console.log('✅ Admin created');
    }
    
    // 2. إنشاء فحوصات مختبر
    const tests = [
      { name: 'CBC - Complete Blood Count', code: 'CBC', category: 'Blood', price: 150, unit: 'cells/μL', referenceRange: 'Varies', isFasting: false, turnaroundTime: 24 },
      { name: 'Lipid Profile', code: 'LIPID', category: 'Blood', price: 200, unit: 'mg/dL', referenceRange: 'Varies', isFasting: true, turnaroundTime: 24 },
      { name: 'HbA1c', code: 'HBA1C', category: 'Blood', price: 180, unit: '%', referenceRange: '4-5.6', isFasting: false, turnaroundTime: 24 },
      { name: 'Urinalysis', code: 'URINE', category: 'Urine', price: 100, unit: 'various', referenceRange: 'Varies', isFasting: false, turnaroundTime: 12 },
      { name: 'X-Ray Chest', code: 'XRAY-CHEST', category: 'X-Ray', price: 300, unit: 'image', referenceRange: 'N/A', isFasting: false, turnaroundTime: 48 }
    ];
    
    for (const t of tests) {
      const exists = await prisma.labTest.findUnique({ where: { code: t.code } });
      if (!exists) {
        await prisma.labTest.create({  t });
        console.log(`✅ Test created: ${t.code}`);
      }
    }
    
    res.json({ success: true, message: '🌱 Seed completed: admin + 5 lab tests created' });
  } catch (e) {
    console.error('❌ Seed error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
