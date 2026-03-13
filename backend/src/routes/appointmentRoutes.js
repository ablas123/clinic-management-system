// File: backend/src/routes/appointmentRoutes.js
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
        { doctor: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { reason: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) where.status = status;
    if (date) where.date = new Date(date);

    // If DOCTOR, only show their appointments
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (doctor) where.doctorId = doctor.id;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { date: 'asc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          doctor: { 
            include: { 
              user: { select: { firstName: true, lastName: true } } 
            } 
          },
          invoice: { select: { id: true, totalAmount: true, status: true } }
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
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// CREATE APPOINTMENT - ✅ مع توليد فاتورة مبدئية تلقائياً
// ===========================================
router.post('/', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req, res) => {
  try {
    const { patientId, doctorId, date, startTime, endTime, type, reason, notes } = req.body;

    if (!patientId || !doctorId || !date) {
      return res.status(400).json({ success: false, message: 'Patient, doctor, and date are required' });
    }

    // ✅ 1. إنشاء الموعد أولاً
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
    const appointmentConfig = { [DATA_KEY]: appointmentPayload };
    const appointment = await prisma.appointment.create(appointmentConfig);

    // ✅ 2. جلب سعر استشارة الطبيب
    const doctor = await prisma.doctor.findUnique({ 
      where: { id: doctorId },
      select: { consultationFee: true, user: { select: { firstName: true, lastName: true } } }
    });

    // ✅ 3. توليد فاتورة مبدئية تلقائياً
    if (doctor?.consultationFee > 0) {
      const invoicePayload = {
        patientId,
        appointmentId: appointment.id,
        totalAmount: doctor.consultationFee,
        paidAmount: 0,
        discount: 0,
        description: `استشارة مع د. ${doctor.user.firstName} ${doctor.user.lastName}`,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 أيام
      };
      const invoiceConfig = { [DATA_KEY]: invoicePayload };
      await prisma.invoice.create(invoiceConfig);
    }

    const responseData = { 
      success: true, 
      message: 'Appointment booked + invoice generated', 
      ['data']: { appointment } 
    };
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// UPDATE APPOINTMENT STATUS - ✅ مع تحديث الفاتورة
// ===========================================
router.patch('/:id/status', authenticate, authorize('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, prescription, vitalSigns } = req.body;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // ✅ تحديث الموعد
    const updatePayload = {
      status: status || existing.status,
      prescription: prescription !== undefined ? prescription : existing.prescription,
      vitalSigns: vitalSigns !== undefined ? vitalSigns : existing.vitalSigns
    };
    const updateConfig = { where: { id }, [DATA_KEY]: updatePayload };
    const appointment = await prisma.appointment.update(updateConfig);

    // ✅ إذا اكتمل الموعد، تحديث حالة الفاتورة إلى "قابلة للدفع"
    if (status === 'COMPLETED' && existing.invoiceId) {
      await prisma.invoice.update({
        where: { id: existing.invoiceId },
        [DATA_KEY]: { status: 'PENDING' }
      });
    }

    const responseData = { 
      success: true, 
      message: 'Status updated', 
      ['data']: { appointment } 
    };
    res.json(responseData);
  } catch (e) {
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
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
