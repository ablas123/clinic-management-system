// File: backend/scripts/createUsers.js - COMPLETE & SAFE
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const DATA_KEY = 'data'; // ✅ Critical for Prisma

async function createUsers() {
  try {
    console.log('🚀 Creating professional test users and Sudan standard lab tests...\n');
    const hashPassword = async (pwd) => await bcrypt.hash(pwd, 10);

    // Helper: Upsert user with role
    const upsertUser = async (email, password, firstName, lastName, phone, role) => {
      return await prisma.user.upsert({
        where: { email },
        update: { role, status: 'ACTIVE' },
        create: {
          email,
          password: await hashPassword(password),
          firstName,
          lastName,
          phone,
          role,
          status: 'ACTIVE'
        }
      });
    };

    // 1. ADMIN
    await upsertUser('admin@clinic.com', 'Admin@123', 'مدير', 'النظام', '0500000001', 'ADMIN');
    console.log('✅ Admin: admin@clinic.com / Admin@123');

    // 2. DOCTOR - Two-step with upsert
    const doctorUser = await upsertUser('doctor@clinic.com', 'Doctor@123', 'د. محمد', 'الأحمد', '0500000002', 'DOCTOR');
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

    // 3. LAB TECH - Two-step with upsert
    const labUser = await upsertUser('lab@clinic.com', 'Lab@123', 'أحمد', 'المعمل', '0500000003', 'LAB_TECH');
    await prisma.labTechnician.upsert({
      where: { userId: labUser.id },
      update: {},
      create: {
        userId: labUser.id,
        licenseNumber: 'LAB001',
        specialization: 'تحاليل دم وأحياء دقيقة'
      }
    });
    console.log('✅ Lab Tech: lab@clinic.com / Lab@123');

    // 4. RECEPTIONIST
    await upsertUser('reception@clinic.com', 'Reception@123', 'سارة', 'الاستقبال', '0500000004', 'RECEPTIONIST');
    console.log('✅ Receptionist: reception@clinic.com / Reception@123');

    // 5. SAMPLE PATIENTS - Upsert by phone
    const patients = [
      { firstName: 'محمد', lastName: 'البريكي', email: 'p1@clinic.com', phone: '0501111111', dateOfBirth: new Date('1990-05-15'), gender: 'MALE', bloodType: 'O+' },
      { firstName: 'فاطمة', lastName: 'السعدي', email: 'p2@clinic.com', phone: '0502222222', dateOfBirth: new Date('1985-08-20'), gender: 'FEMALE', bloodType: 'A+' },
      { firstName: 'خالد', lastName: 'العمري', email: 'p3@clinic.com', phone: '0503333333', dateOfBirth: new Date('1995-02-10'), gender: 'MALE', bloodType: 'B-' }
    ];
    for (const p of patients) {
      await prisma.patient.upsert({ where: { phone: p.phone }, update: {}, create: p });
    }
    console.log('✅ 3 Sample patients created');

    // 6. ✅ SUDAN STANDARD LAB TESTS - Upsert by code
    const sudanTests = [
      { name: 'تحليل دم كامل', code: 'CBC', category: 'BLOOD', price: 1500, unit: 'panel', referenceRange: 'Hb: 12-16 g/dL', isFasting: false, turnaroundTime: 24, description: 'فحص شامل لمكونات الدم', isActive: true },
      { name: 'فحص مزارع الدم', code: 'BFFM', category: 'MICROBIOLOGY', price: 3500, unit: 'culture', referenceRange: 'No growth', isFasting: false, turnaroundTime: 72, description: 'زرع دم لكشف البكتيريا', isActive: true },
      { name: 'سكر الدم', code: 'BG', category: 'BLOOD', price: 800, unit: 'mg/dL', referenceRange: '70-100 mg/dL', isFasting: true, turnaroundTime: 12, description: 'قياس مستوى الجلوكوز', isActive: true },
      { name: 'ملاريا سريع', code: 'ICT_MALARIA', category: 'MICROBIOLOGY', price: 2000, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 1, description: 'فحص سريع للملاريا', isActive: true },
      { name: 'حمى الضنك', code: 'ICT_DENGUE', category: 'MICROBIOLOGY', price: 2500, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 24, description: 'فحص حمى الضنك', isActive: true },
      { name: 'تيفوئيد', code: 'ICT_TYPHOID', category: 'MICROBIOLOGY', price: 2000, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 24, description: 'فحص التيفوئيد', isActive: true },
      { name: 'حمل (HCG)', code: 'ICT_HCG', category: 'BLOOD', price: 1500, unit: 'test', referenceRange: 'Negative (<5 mIU/mL)', isFasting: false, turnaroundTime: 12, description: 'فحص الحمل', isActive: true },
      { name: 'التهاب كبد ب', code: 'ICT_HBV', category: 'BLOOD', price: 3000, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 24, description: 'فحص فيروس التهاب الكبد ب', isActive: true },
      { name: 'التهاب كبد ج', code: 'ICT_HCV', category: 'BLOOD', price: 3000, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 24, description: 'فحص فيروس التهاب الكبد ج', isActive: true },
      { name: 'إيدز (HIV)', code: 'ICT_HIV', category: 'BLOOD', price: 3500, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 24, description: 'فحص فيروس نقص المناعة', isActive: true },
      { name: 'جرثومة المعدة', code: 'ICT_HPYLORI', category: 'BLOOD', price: 2500, unit: 'test', referenceRange: 'Negative', isFasting: true, turnaroundTime: 24, description: 'فحص جرثومة المعدة', isActive: true },
      { name: 'تحليل بول عام', code: 'UG', category: 'URINE', price: 1000, unit: 'sample', referenceRange: 'Normal', isFasting: false, turnaroundTime: 24, description: 'فحص كيميائي ومجهري للبول', isActive: true },
      { name: 'تحليل براز', code: 'SG', category: 'PATHOLOGY', price: 1200, unit: 'sample', referenceRange: 'Normal', isFasting: false, turnaroundTime: 24, description: 'فحص البراز للطفيليات', isActive: true },
      { name: 'وظائف كلى', code: 'RFT', category: 'BLOOD', price: 2500, unit: 'panel', referenceRange: 'Creatinine: 0.6-1.2 mg/dL', isFasting: false, turnaroundTime: 24, description: 'فحص وظائف الكلى', isActive: true },
      { name: 'وظائف كبد', code: 'LFT', category: 'BLOOD', price: 3000, unit: 'panel', referenceRange: 'ALT: 7-56 U/L', isFasting: false, turnaroundTime: 24, description: 'فحص وظائف الكبد', isActive: true }
    ];

    for (const test of sudanTests) {
      await prisma.labTest.upsert({
        where: { code: test.code },
        update: {},
        create: test
      });
    }
    console.log(`✅ ${sudanTests.length} Sudan standard lab tests created`);

    console.log('\n🎉 All seed data created successfully!');
    return true;
  } catch (e) {
    console.error('❌ Seed error:', e);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in server.js
module.exports = { createUsers };

// Run if called directly
if (require.main === module) {
  createUsers().then(() => process.exit(0)).catch(() => process.exit(1));
}