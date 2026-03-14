// File: backend/src/routes/doctorRoutes.js - PRODUCTION READY
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const DATA_KEY = 'data';

// ===========================================
// GET ALL DOCTORS
// ===========================================
router.get('/', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, specialty } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { specialty: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (specialty) {
      where.specialty = specialty;
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      }),
      prisma.doctor.count({ where })
    ]);

    const responseData = {
      success: true,
      ['data']: {
        doctors,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    };
    res.json(responseData);
  } catch (e) {
    console.error('Get doctors error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// CREATE DOCTOR
// ===========================================
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, specialty, licenseNumber, bio, consultationFee, maxPatientsPerDay } = req.body;

    if (!firstName || !lastName || !email || !password || !specialty || !licenseNumber) {
      return res.status(400).json({ success: false, message: 'الحقول المطلوبة: الاسم، البريد، كلمة المرور، التخصص، رقم الترخيص' });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user first
    const userPayload = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      role: 'DOCTOR',
      status: 'ACTIVE'
    };
    const user = await prisma.user.create({ [DATA_KEY]: userPayload });

    // Create doctor profile
    const doctorPayload = {
      userId: user.id,
      specialty,
      licenseNumber,
      bio: bio || null,
      consultationFee: consultationFee ? parseFloat(consultationFee) : 0,
      maxPatientsPerDay: maxPatientsPerDay ? parseInt(maxPatientsPerDay) : 20
    };
    const doctor = await prisma.doctor.create({ [DATA_KEY]: doctorPayload });

    const responseData = { success: true, message: 'تم إضافة الطبيب بنجاح', ['data']: { doctor } };
    res.status(201).json(responseData);
  } catch (e) {
    console.error('Create doctor error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// UPDATE AVAILABILITY
// ===========================================
router.patch('/:id/availability', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    // Check authorization
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { id, userId: req.user.userId } });
      if (!doctor) {
        return res.status(403).json({ success: false, message: 'غير مصرح لك' });
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'غير مصرح لك' });
    }

    const updatePayload = { isAvailable: isAvailable === true || isAvailable === 'true' };
    const doctor = await prisma.doctor.update({
      where: { id },
      [DATA_KEY]: updatePayload
    });

    const responseData = { success: true, message: 'تم تحديث الحالة', ['data']: { doctor } };
    res.json(responseData);
  } catch (e) {
    console.error('Update availability error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// DELETE DOCTOR
// ===========================================
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const existing = await prisma.doctor.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
    }
    await prisma.doctor.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'تم حذف الطبيب' });
  } catch (e) {
    console.error('Delete doctor error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;