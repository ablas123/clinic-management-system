// File: backend/src/routes/doctorRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
// ✅ ثابت لتجنب مشكلة : في جميع استدعاءات Prisma
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
              phone: true,
              avatar: true
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
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// GET DOCTOR BY ID
// ===========================================
router.get('/:id', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        appointments: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
          take: 5,
          include: { patient: { select: { firstName: true, lastName: true } } }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const responseData = { success: true, ['data']: { doctor } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// CREATE DOCTOR - ✅ استخدام DATA_KEY
// ===========================================
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, specialty, licenseNumber, bio, consultationFee, maxPatientsPerDay } = req.body;

    if (!firstName || !lastName || !email || !password || !specialty || !licenseNumber) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ إنشاء المستخدم
    const userPayload = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      role: 'DOCTOR',
      status: 'ACTIVE'
    };
    const userConfig = { [DATA_KEY]: userPayload };
    const user = await prisma.user.create(userConfig);

    // ✅ إنشاء ملف الطبيب
    const doctorPayload = {
      userId: user.id,
      specialty,
      licenseNumber,
      bio: bio || null,
      consultationFee: consultationFee ? parseFloat(consultationFee) : 0,
      maxPatientsPerDay: maxPatientsPerDay ? parseInt(maxPatientsPerDay) : 20
    };
    const doctorConfig = { [DATA_KEY]: doctorPayload };
    const doctor = await prisma.doctor.create(doctorConfig);

    const responseData = { success: true, message: 'Doctor created', ['data']: { doctor } };
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// UPDATE AVAILABILITY - ✅ استخدام DATA_KEY هنا أيضاً
// ===========================================
router.patch('/:id/availability', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { id, userId: req.user.userId } });
      if (!doctor) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // ✅ استخدام DATA_KEY لتجنب مشكلة :
    const updatePayload = { isAvailable: isAvailable === true || isAvailable === 'true' };
    const updateConfig = { where: { id }, [DATA_KEY]: updatePayload };
    const doctor = await prisma.doctor.update(updateConfig);

    const responseData = { success: true, message: 'Availability updated', ['data']: { doctor } };
    res.json(responseData);
  } catch (e) {
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
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    await prisma.doctor.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Doctor deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
