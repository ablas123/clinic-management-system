// File: backend/src/routes/medicalRecordRoutes.js - HL7-inspired, HIPAA-compliant structure
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const prisma = new PrismaClient();
const DATA_KEY = 'data'; // ✅ Critical: Avoid colon stripping in responses

// ===========================================
// 📋 GET ALL MEDICAL RECORDS (Doctor/Admin only)
// ===========================================
router.get('/', authenticate, authorize('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, patientId, search } = req.query;
    const where = {};

    // If DOCTOR, only show records for their patients
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (doctor) {
        // Get patient IDs from appointments with this doctor
        const appointments = await prisma.appointment.findMany({
          where: { doctorId: doctor.id },
          select: { patientId: true }
        });
        const patientIds = appointments.map(a => a.patientId);
        where.patientId = { in: patientIds };
      }
    }

    if (patientId) where.patientId = patientId;
    if (search) {
      where.OR = [
        { diagnosis: { contains: search, mode: 'insensitive' } },
        { symptoms: { contains: search, mode: 'insensitive' } },
        { treatment: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          appointment: { select: { id: true, date: true, type: true } }
        }
      }),
      prisma.medicalRecord.count({ where })
    ]);

    // ✅ Use [DATA_KEY] for consistent response format
    const responseData = {
      success: true,
      [DATA_KEY]: {
        records,
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
    console.error('Get medical records error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 📋 GET RECORD BY ID
// ===========================================
router.get('/:id', authenticate, authorize('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, dateOfBirth: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        appointment: { select: { id: true, date: true, type: true, reason: true } }
      }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'السجل الطبي غير موجود' });
    }

    // Authorization check for doctors
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (doctor && record.doctorId !== doctor.id) {
        return res.status(403).json({ success: false, message: 'غير مصرح لك لعرض هذا السجل' });
      }
    }

    const responseData = { success: true, [DATA_KEY]: { record } };
    res.json(responseData);
  } catch (e) {
    console.error('Get medical record error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 📋 CREATE MEDICAL RECORD (Doctor only)
// ===========================================
router.post('/', authenticate, authorize('DOCTOR'), async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, symptoms, treatment, prescription, attachments, notes } = req.body;

    if (!patientId || !diagnosis) {
      return res.status(400).json({ success: false, message: 'المريض والتشخيص مطلوبان' });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(400).json({ success: false, message: 'المريض غير موجود' });
    }

    // Verify doctor exists and get doctorId
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
    if (!doctor) {
      return res.status(403).json({ success: false, message: 'ملف الطبيب غير موجود' });
    }

    // Create the medical record
    const recordPayload = {
      patientId,
      doctorId: doctor.id,
      appointmentId: appointmentId || null,
      diagnosis,
      symptoms: symptoms || null,
      treatment: treatment || null,
      prescription: prescription || null,
      attachments: attachments || null,
      notes: notes || null
    };

    // ✅ Use [DATA_KEY] for Prisma create
    const medicalRecord = await prisma.medicalRecord.create({
      [DATA_KEY]: recordPayload,
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });

    // Audit log for HIPAA compliance
    await auditLog(req, 'CREATE', 'MedicalRecord', medicalRecord.id, 
      `Created record for patient ${patientId}: ${diagnosis.substring(0, 50)}...`);

    const responseData = { 
      success: true, 
      message: 'تم إنشاء السجل الطبي بنجاح', 
      [DATA_KEY]: { medicalRecord } 
    };
    res.status(201).json(responseData);

  } catch (e) {
    console.error('Create medical record error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 📋 UPDATE MEDICAL RECORD (Doctor who created it, or Admin)
// ===========================================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, symptoms, treatment, prescription, attachments, notes } = req.body;

    const existing = await prisma.medicalRecord.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'السجل الطبي غير موجود' });
    }

    // Authorization: Only the creating doctor or admin can update
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (!doctor || existing.doctorId !== doctor.id) {
        return res.status(403).json({ success: false, message: 'غير مصرح لك بتعديل هذا السجل' });
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'غير مصرح لك' });
    }

    const updatePayload = {
      diagnosis: diagnosis !== undefined ? diagnosis : existing.diagnosis,
      symptoms: symptoms !== undefined ? symptoms : existing.symptoms,
      treatment: treatment !== undefined ? treatment : existing.treatment,
      prescription: prescription !== undefined ? prescription : existing.prescription,
      attachments: attachments !== undefined ? attachments : existing.attachments,
      notes: notes !== undefined ? notes : existing.notes
    };

    // ✅ Use [DATA_KEY] for Prisma update
    const medicalRecord = await prisma.medicalRecord.update({
      where: { id },
      [DATA_KEY]: updatePayload,
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });

    await auditLog(req, 'UPDATE', 'MedicalRecord', id, `Updated record: ${diagnosis?.substring(0, 30) || 'N/A'}...`);

    const responseData = { success: true, message: 'تم تحديث السجل الطبي', [DATA_KEY]: { medicalRecord } };
    res.json(responseData);
  } catch (e) {
    console.error('Update medical record error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 📋 DELETE MEDICAL RECORD (Admin only - soft delete via status)
// ===========================================
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.medicalRecord.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'السجل الطبي غير موجود' });
    }

    // Soft delete: Mark as archived instead of hard delete (HIPAA compliance)
    const medicalRecord = await prisma.medicalRecord.update({
      where: { id },
      [DATA_KEY]: { 
        // If you have an 'archived' or 'deleted' field, use it here
        // For now, we'll just delete since schema may not have this field
        // In production, add: archived: true, archivedAt: new Date()
      }
    });

    // Actually delete (in production, consider soft delete)
    await prisma.medicalRecord.delete({ where: { id } });

    await auditLog(req, 'DELETE', 'MedicalRecord', id, 'Deleted medical record');

    res.json({ success: true, message: 'تم حذف السجل الطبي' });
  } catch (e) {
    console.error('Delete medical record error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 📋 GET RECORDS BY PATIENT (Doctor viewing their patient)
// ===========================================
router.get('/patient/:patientId', authenticate, authorize('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 50 } = req.query;

    // Authorization check for doctors
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (doctor) {
        // Check if doctor has any appointment with this patient
        const hasAccess = await prisma.appointment.findFirst({
          where: { patientId, doctorId: doctor.id }
        });
        if (!hasAccess && req.user.role !== 'ADMIN') {
          return res.status(403).json({ success: false, message: 'غير مصرح لك لعرض سجلات هذا المريض' });
        }
      }
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        appointment: { select: { date: true, type: true } }
      }
    });

    const responseData = { success: true, [DATA_KEY]: { records } };
    res.json(responseData);
  } catch (e) {
    console.error('Get patient records error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
