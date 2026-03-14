// File: backend/scripts/createUsers.js - FIXED VERSION
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🚀 Creating professional test users...\n');
    const hashPassword = async (pwd) => await bcrypt.hash(pwd, 10);

    // 1. ADMIN - باستخدام upsert الصحيح
    await prisma.user.upsert({
      where: { email: 'admin@clinic.com' },
      update: { role: 'ADMIN', status: 'ACTIVE' },
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
    console.log('✅ Admin: admin@clinic.com / Admin@123');

    // 2. DOCTOR - فصل إنشاء المستخدم عن الملف المهني
    const doctorUser = await prisma.user.upsert({
      where: { email: 'doctor@clinic.com' },
      update: { role: 'DOCTOR', status: 'ACTIVE' },
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
    
    // ✅ إنشاء ملف الطبيب فقط إذا لم يكن موجوداً
    await prisma.doctor.upsert({
      where: { userId: doctorUser.id },
      update: {},
      create: {
        userId: doctorUser.id,
        specialty: 'طب عام',
        licenseNumber: 'DOC001',
        bio: 'طبيب عام متخصص',
        consultationFee: 150.00,
        maxPatientsPerDay: 20
      }
    });
    console.log('✅ Doctor: doctor@clinic.com / Doctor@123');

    // 3. LAB TECH - نفس النمط
    const labUser = await prisma.user.upsert({
      where: { email: 'lab@clinic.com' },
      update: { role: 'LAB_TECH', status: 'ACTIVE' },
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
    
    await prisma.labTechnician.upsert({
      where: { userId: labUser.id },
      update: {},
      create: {
        userId: labUser.id,
        licenseNumber: 'LAB001',
        specialization: 'تحاليل دم'
      }
    });
    console.log('✅ Lab Tech: lab@clinic.com / Lab@123');

    // 4. RECEPTIONIST
    await prisma.user.upsert({
      where: { email: 'reception@clinic.com' },
      update: { role: 'RECEPTIONIST', status: 'ACTIVE' },
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
    console.log('✅ Receptionist: reception@clinic.com / Reception@123');

    // 5. SAMPLE PATIENTS - باستخدام upsert لكل مريض
    const patientsData = [
      { firstName: 'محمد', lastName: 'البريكي', email: 'p1@clinic.com', phone: '0501111111', dateOfBirth: new Date('1990-05-15'), gender: 'MALE', bloodType: 'O+' },
      { firstName: 'فاطمة', lastName: 'السعدي', email: 'p2@clinic.com', phone: '0502222222', dateOfBirth: new Date('1985-08-20'), gender: 'FEMALE', bloodType: 'A+' },
      { firstName: 'خالد', lastName: 'العمري', email: 'p3@clinic.com', phone: '0503333333', dateOfBirth: new Date('1995-02-10'), gender: 'MALE', bloodType: 'B-' }
    ];

    for (const p of patientsData) {
      await prisma.patient.upsert({
        where: { phone: p.phone },
        update: {},
        create: p
      });
    }
    console.log('✅ 3 Sample patients created');

    // 6. SAMPLE LAB TESTS - باستخدام upsert لكل فحص
    const testsData = [
      { name: 'تحليل دم كامل', code: 'CBC001', category: 'BLOOD', price: 150.00, unit: 'ml', referenceRange: '12-16 g/dL', isFasting: false, turnaroundTime: 24 },
      { name: 'سكر صائم', code: 'GLU001', category: 'BLOOD', price: 80.00, unit: 'mg/dL', referenceRange: '70-100 mg/dL', isFasting: true, turnaroundTime: 12 },
      { name: 'تحليل بول', code: 'UA001', category: 'URINE', price: 100.00, unit: 'sample', referenceRange: 'Normal', isFasting: false, turnaroundTime: 24 },
      { name: 'أشعة صدر', code: 'CXR001', category: 'XRAY', price: 250.00, unit: 'image', referenceRange: 'No abnormalities', isFasting: false, turnaroundTime: 48 }
    ];

    for (const t of testsData) {
      await prisma.labTest.upsert({
        where: { code: t.code },
        update: {},
        create: t
      });
    }
    console.log('✅ 4 Sample lab tests created');

    console.log('\n🎉 All test data created/updated successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│ Admin:        admin@clinic.com          │');
    console.log('│ Doctor:       doctor@clinic.com         │');
    console.log('│ Lab Tech:     lab@clinic.com            │');
    console.log('│ Receptionist: reception@clinic.com      │');
    console.log('│ Password:     ***@123 (same for all)   │');
    console.log('└─────────────────────────────────────────┘');
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();