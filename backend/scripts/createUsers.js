// File: backend/scripts/createUsers.js - COMPLETE & FINAL
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🚀 Creating professional test users...\n');
    const hashPassword = async (pwd) => await bcrypt.hash(pwd, 10);

    // 1. ADMIN
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

    // 2. DOCTOR - ✅ خطوتين: User ثم Doctor
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

    // 3. LAB TECH - ✅ خطوتين: User ثم LabTechnician
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