// File: backend/scripts/createUsers.js - COMPLETE & SUDAN STANDARDS
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const DATA_KEY = 'data';

async function createUsers() {
  try {
    console.log('🚀 Creating professional test users and Sudan standard lab tests...\n');
    const hashPassword = async (pwd) => await bcrypt.hash(pwd, 10);

    // 1. ADMIN - ✅ using upsert
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

    // 2. DOCTOR - ✅ two-step with upsert
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

    // 3. LAB TECH - ✅ two-step with upsert
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
        specialization: 'تحاليل دم وأحياء دقيقة'
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

    // 5. SAMPLE PATIENTS - ✅ using upsert by phone
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

    // 6. ✅ SUDAN STANDARD LAB TESTS - Using upsert by code
    const sudanLabTests = [
      // 🔴 Blood Tests
      { name: 'تحليل دم كامل', code: 'CBC', category: 'BLOOD', price: 1500, unit: 'panel', referenceRange: 'Hb: 12-16 g/dL, WBC: 4-11 K/µL', isFasting: false, turnaroundTime: 24, description: 'فحص شامل لمكونات الدم', isActive: true },
      { name: 'فحص مزارع الدم', code: 'BFFM', category: 'MICROBIOLOGY', price: 3500, unit: 'culture', referenceRange: 'No growth', isFasting: false, turnaroundTime: 72, description: 'زرع دم لكشف البكتيريا', isActive: true },
      { name: 'سكر الدم', code: 'BG', category: 'BLOOD', price: 800, unit: 'mg/dL', referenceRange: '70-100 mg/dL', isFasting: true, turnaroundTime: 12, description: 'قياس مستوى الجلوكوز', isActive: true },
      
      // 🦟 Infectious Disease Tests (ICT Panel)
      { name: 'ملاريا سريع', code: 'ICT_MALARIA', category: 'MICROBIOLOGY', price: 2000, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 1, description: 'فحص سريع للملاريا', isActive: true },
      { name: 'حمى الضنك', code: 'ICT_DENGUE', category: 'MICROBIOLOGY', price: 2500, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 24, description: 'فحص حمى الضنك', isActive: true },
      { name: 'تيفوئيد', code: 'ICT_TYPHOID', category: 'MICROBIOLOGY', price: 2000, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 24, description: 'فحص التيفوئيد', isActive: true },
      { name: 'حمل (HCG)', code: 'ICT_HCG', category: 'BLOOD', price: 1500, unit: 'test', referenceRange: 'Negative (<5 mIU/mL)', isFasting: false, turnaroundTime: 12, description: 'فحص الحمل', isActive: true },
      { name: 'التهاب كبد ب', code: 'ICT_HBV', category: 'BLOOD', price: 3000, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 24, description: 'فحص فيروس التهاب الكبد ب', isActive: true },
      { name: 'التهاب كبد ج', code: 'ICT_HCV', category: 'BLOOD', price: 3000, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 24, description: 'فحص فيروس التهاب الكبد ج', isActive: true },
      { name: 'إيدز (HIV)', code: 'ICT_HIV', category: 'BLOOD', price: 3500, unit: 'test', referenceRange: 'Negative', isFasting: false, turnaroundTime: 24, description: 'فحص فيروس نقص المناعة', isActive: true },
      { name: 'جرثومة المعدة', code: 'ICT_HPYLORI', category: 'BLOOD', price: 2500, unit: 'test', referenceRange: 'Negative', isFasting: true, turnaroundTime: 24, description: 'فحص جرثومة المعدة (هيليكوباكتر)', isActive: true },
      
      // 🧪 Urine & Stool Tests
      { name: 'تحليل بول عام', code: 'UG', category: 'URINE', price: 1000, unit: 'sample', referenceRange: 'Normal', isFasting: false, turnaroundTime: 24, description: 'فحص كيميائي ومجهري للبول', isActive: true },
      { name: 'تحليل براز', code: 'SG', category: 'PATHOLOGY', price: 1200, unit: 'sample', referenceRange: 'Normal', isFasting: false, turnaroundTime: 24, description: 'فحص البراز للطفيليات والبكتيريا', isActive: true },
      
      // 🫀 Kidney & Liver Function
      { name: 'وظائف كلى', code: 'RFT', category: 'BLOOD', price: 2500, unit: 'panel', referenceRange: 'Creatinine: 0.6-1.2 mg/dL, Urea: 15-40 mg/dL', isFasting: false, turnaroundTime: 24, description: 'فحص وظائف الكلى الكامل', isActive: true },
      { name: 'وظائف كبد', code: 'LFT', category: 'BLOOD', price: 3000, unit: 'panel', referenceRange: 'ALT: 7-56 U/L, AST: 10-40 U/L, Bilirubin: 0.3-1.2 mg/dL', isFasting: false, turnaroundTime: 24, description: 'فحص وظائف الكبد الكامل', isActive: true }
    ];

    for (const test of sudanLabTests) {
      await prisma.labTest.upsert({
        where: { code: test.code }, // ✅ Upsert by unique code
        update: {},
        create: test
      });
    }
    console.log(`✅ ${sudanLabTests.length} Sudan standard lab tests created/updated`);

    console.log('\n🎉 All test data created successfully!');
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