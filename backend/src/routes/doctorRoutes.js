// ===========================================
// 👨‍⚕️ DOCTORS ROUTES - مع تسجيل كامل للطلب
// ===========================================
// File: backend/src/routes/doctorRoutes.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// ===========================================
// 📤 CREATE DOCTOR - مع تسجيل مفصّل
// ===========================================
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    // 🔍 تسجيل كل ما يصل من الفرونت إند
    console.log('🔍 [DEBUG] POST /doctors received:');
    console.log('🔍 [DEBUG] req.body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 [DEBUG] req.headers:', JSON.stringify(req.headers, null, 2));

    // ✅ استخراج الحقول بكل الصيغ الممكنة
    const { 
      firstName, lastName, name,
      email, phone,
      specialization, specialty,
      licenseNumber, isAvailable 
    } = req.body;

    // ✅ دعم كل الصيغ
    const finalFirstName = firstName || (name ? name.split(' ')[0] : '');
    const finalLastName = lastName || (name ? name.split(' ').slice(1).join(' ') : '');
    const finalSpecialization = specialization || specialty || '';

    // 🔍 تسجيل الحقول المستخلصة
    console.log('🔍 [DEBUG] Parsed fields:', {
      finalFirstName, finalLastName, email, finalSpecialization
    });

    // ✅ التحقق (رسالة خطأ واضحة)
    if (!finalFirstName || !finalLastName || !email || !finalSpecialization) {
      console.error('❌ [VALIDATION FAILED] Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Required: firstName, lastName, email, specialization (or: name, email, specialty)' 
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

    // ✅ الإنشاء
    const doctor = await prisma.doctor.create({
      data: {
        firstName: finalFirstName,
        lastName: finalLastName,
        email,
        phone: phone || null,
        specialization: finalSpecialization,
        licenseNumber: licenseNumber || null,
        isAvailable: isAvailable ?? true
      }
    });

    console.log('✅ Doctor created:', doctor.id);
    res.status(201).json({ 
      success: true, 
      message: 'Doctor created successfully', 
      data: { doctor } 
    });

  } catch (e) {
    console.error('❌ [ERROR] Create doctor failed:', e);
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
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
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
          id: true, firstName: true, lastName: true, email: true,
          phone: true, specialization: true, licenseNumber: true,
          isAvailable: true, createdAt: true, updatedAt: true
        }
      }),
      prisma.doctor.count({ where })
    ]);

    res.json({
      success: true,
      data: {
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
        id: true, firstName: true, lastName: true, email: true,
        phone: true, specialization: true, licenseNumber: true,
        isAvailable: true, createdAt: true, updatedAt: true
      }
    });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: { doctor } });
  } catch (e) {
    console.error('❌ Get doctor error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to fetch doctor' });
  }
});

// ===========================================
// ✏️ UPDATE DOCTOR
// ===========================================
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, name, email, phone, specialization, specialty, licenseNumber, isAvailable } = req.body;
    
    const finalFirstName = firstName || (name ? name.split(' ')[0] : undefined);
    const finalLastName = lastName || (name ? name.split(' ').slice(1).join(' ') : undefined);
    const finalSpecialization = specialization || specialty || undefined;

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
      data: {
        firstName: finalFirstName ?? existing.firstName,
        lastName: finalLastName ?? existing.lastName,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        specialization: finalSpecialization ?? existing.specialization,
        licenseNumber: licenseNumber ?? existing.licenseNumber,
        isAvailable: isAvailable ?? existing.isAvailable
      }
    });
    res.json({ success: true, message: 'Doctor updated', data: { doctor } });
  } catch (e) {
    console.error('❌ Update doctor error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to update doctor' });
  }
});

// ===========================================
// 🗑️ DELETE DOCTOR
// ===========================================
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
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
router.patch('/:id/availability', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctor = await prisma.doctor.update({ where: { id }, data: { isAvailable } });
    res.json({ success: true, message: 'Availability updated', data: { doctor } });
  } catch (e) {
    console.error('❌ Update availability error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to update' });
  }
});

// ===========================================
// 📊 STATS
// ===========================================
router.get('/stats/summary', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const [total, available, bySpecialty] = await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { isAvailable: true } }),
      prisma.doctor.groupBy({ by: ['specialization'], _count: { specialization: true } })
    ]);
    res.json({
      success: true,
      data: {
        total,
        available,
        unavailable: total - available,
        bySpecialty: bySpecialty.map(s => ({ specialization: s.specialization, count: s._count.specialization }))
      }
    });
  } catch (e) {
    console.error('❌ Stats error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to fetch stats' });
  }
});

module.exports = router;