// File: backend/src/routes/appointmentRoutes.js - PRODUCTION READY
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const DATA_KEY = 'data';

// ===========================================
// GET ALL APPOINTMENTS
// ===========================================
router.get('/', authenticate, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, date } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) where.status = status;
    if (date) where.date = { gte: new Date(date) };

    // If DOCTOR, only show their appointments
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (doctor) {
        where.doctorId = doctor.id;
      }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { date: 'asc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } }
        }
      }),
      prisma.appointment.count({ where })
    ]);

    const responseData = {
      success: true,
      ['data']: {
        appointments,
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
    console.error('Get appointments error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// CREATE APPOINTMENT
// ===========================================
router.post('/', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req, res) => {
  try {
    const { patientId, doctorId, date, startTime, endTime, type, reason, notes } = req.body;

    if (!patientId || !doctorId || !date) {
      return res.status(400).json({ success: false, message: 'المريض، الطبيب، والتاريخ مطلوبة' });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(400).json({ success: false, message: 'المريض غير موجود' });
    }

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return res.status(400).json({ success: false, message: 'الطبيب غير موجود' });
    }

    const appointmentPayload = {
      patientId,
      doctorId,
      date: new Date(date),
      startTime: startTime || null,
      endTime: endTime || null,
      type: type || 'CHECKUP',
      status: 'SCHEDULED',
      reason: reason || null,
      notes: notes || null
    };

    const appointment = await prisma.appointment.create({
      [DATA_KEY]: appointmentPayload,
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });

    const responseData = { success: true, message: 'تم حجز الموعد بنجاح', ['data']: { appointment } };
    res.status(201).json(responseData);
  } catch (e) {
    console.error('Create appointment error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// UPDATE STATUS
// ===========================================
router.patch('/:id/status', authenticate, authorize('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, prescription, vitalSigns } = req.body;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    }

    const updatePayload = {
      status: status || existing.status,
      prescription: prescription !== undefined ? prescription : existing.prescription,
      vitalSigns: vitalSigns !== undefined ? vitalSigns : existing.vitalSigns
    };

    const appointment = await prisma.appointment.update({
      where: { id },
      [DATA_KEY]: updatePayload
    });

    const responseData = { success: true, message: 'تم تحديث الحالة', ['data']: { appointment } };
    res.json(responseData);
  } catch (e) {
    console.error('Update status error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// DELETE APPOINTMENT
// ===========================================
router.delete('/:id', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const existing = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    }
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'تم إلغاء الموعد' });
  } catch (e) {
    console.error('Delete appointment error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;