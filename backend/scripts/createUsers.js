const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🚀 Creating test users...');

    // Hash passwords
    const hashPassword = async (pwd) => await bcrypt.hash(pwd, 10);

    // 1. Admin
    await prisma.user.upsert({
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
    
    await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        specialty: 'طب عام',
        licenseNumber: 'DOC001',
        bio: 'طبيب عام متخصص',
        consultationFee: 150.00,
        maxPatientsPerDay: 20
      }
    });
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
    
    await prisma.labTechnician.create({
      data: {
        userId: labUser.id,
        licenseNumber: 'LAB001',
        specialization: 'تحاليل دم'
      }
    });
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

    console.log('🎉 All users created successfully!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}

createUsers();
