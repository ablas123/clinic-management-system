// ===========================================
// 👨‍⚕️ DOCTORS ROUTES - مطابق لـ Prisma Schema
// ===========================================
// File: backend/src/routes/doctorRoutes.js
// الحقول الصحيحة: name, specialty, bio, avatar

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ===========================================
// 📤 CREATE DOCTOR
// ===========================================
router.post('/', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] POST /doctors body:', JSON.stringify(req.body));

    const { 
      // ✅ دعم الصيغة القديمة (من الفرونت إند)
      firstName, lastName,
      // ✅ والصيغة الجديدة (من الـ Schema)
      name,
      email, phone,
      specialization, specialty,
      licenseNumber, bio,
      avatar, isAvailable 
    } = req.body;

    // ✅ دمج الاسم إذا أرسل منفصلاً
    const finalName = name || (firstName && lastName ? `${firstName} ${lastName}` : '');
    // ✅ توحيد اسم التخصص
    const finalSpecialty = specialty || specialization || '';
    // ✅ توحيد السيرة الذاتية
    const finalBio = bio || licenseNumber || '';

    // ✅ التحقق من الحقول المطلوبة (بأسماء الـ Schema)
    if (!finalName || !email || !finalSpecialty) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and specialty are required' 
      });
    }

    // ✅ التحقق من البريد المكرر
    const existing = await prisma.doctor.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor with this email already exists' 
      });
    }

    // ✅ الإنشاء - باستخدام أسماء الحقول الصحيحة في الـ Schema
    const doctor = await prisma.doctor.create({
       {
        name: finalName,
        email,
        phone: phone || null,
        specialty: finalSpecialty,
        bio: finalBio || null,
        avatar: avatar || null,
        isAvailable: isAvailable ?? true
      }
    });

    console.log('✅ Doctor created:', doctor.id);
    res.status(201).json({ 
      success: true, 
      message: 'Doctor created successfully', 
       { doctor } 
    });

  } catch (e) {
    console.error('❌ Create doctor error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to create doctor' 
    });
  }
});

// ===========================================
// 📥 GET ALL DOCTORS
// ===========================================
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, available } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (available !== undefined) {
      where.isAvailable = available === 'true';
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          // ✅ أسماء الحقول الصحيحة حسب الـ Schema
          id: true,
          name: true,
          email: true,
          phone: true,
          specialty: true,
          bio: true,
          avatar: true,
          isAvailable: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.doctor.count({ where })
    ]);

    res.json({
      success: true,
       {
        doctors,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (e) {
    console.error('❌ Get doctors error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to fetch doctors' });
  }
});

// ===========================================
// 📥 GET DOCTOR BY ID
// ===========================================
router.get('/:id', async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        bio: true,
        avatar: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true,  { doctor } });
  } catch (e) {
    console.error('❌ Get doctor error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to fetch doctor' });
  }
});

// ===========================================
// ✏️ UPDATE DOCTOR
// ===========================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, name, email, phone, specialization, specialty, licenseNumber, bio, avatar, isAvailable } = req.body;
    
    const finalName = name || (firstName && lastName ? `${firstName} ${lastName}` : undefined);
    const finalSpecialty = specialty || specialization || undefined;
    const finalBio = bio || licenseNumber || undefined;

    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    if (email && email !== existing.email) {
      const emailExists = await prisma.doctor.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    const doctor = await prisma.doctor.update({
      where: { id },
       {
        name: finalName ?? existing.name,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        specialty: finalSpecialty ?? existing.specialty,
        bio: finalBio ?? existing.bio,
        avatar: avatar ?? existing.avatar,
        isAvailable: isAvailable ?? existing.isAvailable
      }
    });
    res.json({ success: true, message: 'Doctor updated',  { doctor } });
  } catch (e) {
    console.error('❌ Update doctor error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to update doctor' });
  }
});

// ===========================================
// 🗑️ DELETE DOCTOR
// ===========================================
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.doctor.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    await prisma.doctor.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Doctor deleted' });
  } catch (e) {
    console.error('❌ Delete doctor error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to delete doctor' });
  }
});

// ===========================================
// 🔄 TOGGLE AVAILABILITY
// ===========================================
router.patch('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctor = await prisma.doctor.update({ 
      where: { id }, 
       { isAvailable } 
    });
    res.json({ success: true, message: 'Availability updated',  { doctor } });
  } catch (e) {
    console.error('❌ Update availability error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to update' });
  }
});

// ===========================================
// 📊 STATS
// ===========================================
router.get('/stats/summary', async (req, res) => {
  try {
    const [total, available, bySpecialty] = await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { isAvailable: true } }),
      prisma.doctor.groupBy({ by: ['specialty'], _count: { specialty: true } })
    ]);
    res.json({
      success: true,
       {
        total,
        available,
        unavailable: total - available,
        bySpecialty: bySpecialty.map(s => ({ specialty: s.specialty, count: s._count.specialty }))
      }
    });
  } catch (e) {
    console.error('❌ Stats error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to fetch stats' });
  }
});

module.exports = router;