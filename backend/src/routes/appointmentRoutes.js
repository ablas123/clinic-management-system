const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET ALL
router.get('/', authenticate, async (req, res) => {
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

    const findConfig = {
      where: where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, date: true, reason: true, status: true,
        patientId: true, doctorId: true,
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, user: { select: { firstName: true, lastName: true } }, specialty: true } },
        createdAt: true, updatedAt: true
      }
    };
    const appointments = await prisma.appointment.findMany(findConfig);
    const countConfig = { where: where };
    const total = await prisma.appointment.count(countConfig);

    const responseData = {
      success: true,
      data: {
        appointments: appointments,
        pagination: {
          total: total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE
router.post('/', authenticate, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { patientId, doctorId, date, reason, status } = req.body;
    if (!patientId || !doctorId || !date) {
      return res.status(400).json({ success: false, message: 'Patient, doctor, and date are required' });
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const createConfig = {
      data: {
        patientId: patientId,
        doctorId: doctorId,
        date: appointmentDate,
        reason: reason || null,
        status: status || 'SCHEDULED'
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, specialty: true, user: { select: { firstName: true, lastName: true } } } }
      }
    };
    const appointment = await prisma.appointment.create(createConfig);

    const responseData = { success: true, message: 'Appointment booked', data: { appointment: appointment } };
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE STATUS
router.patch('/:id/status', authenticate, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateConfig = {
      where: { id: id },
      data: { status: status }
    };
    const appointment = await prisma.appointment.update(updateConfig);

    const responseData = { success: true, message: 'Status updated', data: { appointment: appointment } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE
router.delete('/:id', authenticate, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), async (req, res) => {
  try {
    const existingConfig = { where: { id: req.params.id } };
    const existing = await prisma.appointment.findUnique(existingConfig);
    if (!existing) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const deleteConfig = { where: { id: req.params.id } };
    await prisma.appointment.delete(deleteConfig);

    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
