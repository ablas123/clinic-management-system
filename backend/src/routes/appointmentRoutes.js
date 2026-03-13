const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ===========================================
// GET ALL APPOINTMENTS
// ===========================================
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, date } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { doctor: { name: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) where.status = status;
    if (date) where.date = date;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          date: true,
          reason: true,
          status: true,
          patientId: true,
          doctorId: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialty: true
            }
          },
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.appointment.count({ where: where })
    ]);

    res.json({
      success: true,
       {
        appointments: appointments,
        pagination: {
          total: total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (e) {
    console.error('Get appointments error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to fetch appointments' });
  }
});

// ===========================================
// CREATE APPOINTMENT - ✅ تمت الإضافة: include لرجوع بيانات المريض والطبيب
// ===========================================
router.post('/', async (req, res) => {
  try {
    const { patientId, doctorId, date, reason, status } = req.body;

    if (!patientId || !doctorId || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Patient, doctor, and date are required' 
      });
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format' 
      });
    }

    // ✅ CREATE مع include: لرجوع بيانات المريض والطبيب مع الموعد
    const appointment = await prisma.appointment.create({
       {
        patientId: patientId,
        doctorId: doctorId,
        date: appointmentDate,
        reason: reason || null,
        status: status || 'SCHEDULED'
      },
      include: {  // ← ✅ هذا هو الحل: إرجاع بيانات المريض والطبيب
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        }
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Appointment booked successfully', 
       {
        appointment: appointment
      } 
    });
  } catch (e) {
    console.error('Create appointment error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to book appointment' 
    });
  }
});

// ===========================================
// UPDATE APPOINTMENT
// ===========================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, reason, status } = req.body;

    const existing = await prisma.appointment.findUnique({ where: { id: id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const updateData = {
      reason: reason !== undefined ? reason : existing.reason,
      status: status !== undefined ? status : existing.status
    };
    
    if (date !== undefined && date !== null) {
      const appointmentDate = new Date(date);
      if (!isNaN(appointmentDate.getTime())) {
        updateData.date = appointmentDate;
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: id },
      data: updateData
    });
    
    res.json({ 
      success: true, 
      message: 'Appointment updated', 
       {
        appointment: appointment
      } 
    });
  } catch (e) {
    console.error('Update appointment error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to update appointment' });
  }
});

// ===========================================
// DELETE APPOINTMENT
// ===========================================
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (e) {
    console.error('Delete appointment error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to cancel appointment' });
  }
});

// ===========================================
// UPDATE APPOINTMENT STATUS
// ===========================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const existing = await prisma.appointment.findUnique({ where: { id: id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    const appointment = await prisma.appointment.update({ 
      where: { id: id }, 
       { 
        status: status 
      } 
    });
    
    res.json({ 
      success: true, 
      message: 'Status updated', 
       {
        appointment: appointment
      } 
    });
  } catch (e) {
    console.error('Update status error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to update status' });
  }
});

module.exports = router;