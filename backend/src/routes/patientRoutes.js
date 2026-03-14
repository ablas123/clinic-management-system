// File: backend/src/routes/patientRoutes.js - PRODUCTION READY
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const DATA_KEY = 'data';

// ===========================================
// GET ALL PATIENTS
// ===========================================
router.get('/', authenticate, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where })
    ]);

    const responseData = {
      success: true,
      ['data']: {
        patients,
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
    console.error('Get patients error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// GET PATIENT BY ID
// ===========================================
router.get('/:id', authenticate, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id }
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const responseData = { success: true, ['data']: { patient } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// CREATE PATIENT
// ===========================================
router.post('/', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, gender, bloodType, address, emergencyContact, emergencyPhone, medicalHistory } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ success: false, message: 'الاسم الأول، اسم العائلة، والهاتف مطلوبة' });
    }

    const patientPayload = {
      firstName,
      lastName,
      email: email || null,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null,
      bloodType: bloodType || null,
      address: address || null,
      emergencyContact: emergencyContact || null,
      emergencyPhone: emergencyPhone || null,
      medicalHistory: medicalHistory || null
    };

    const patient = await prisma.patient.create({ [DATA_KEY]: patientPayload });

    const responseData = { success: true, message: 'تم إضافة المريض بنجاح', ['data']: { patient } };
    res.status(201).json(responseData);
  } catch (e) {
    console.error('Create patient error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// UPDATE PATIENT
// ===========================================
router.put('/:id', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, dateOfBirth, gender, bloodType, address, emergencyContact, emergencyPhone, medicalHistory } = req.body;

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    }

    const updatePayload = {
      firstName: firstName !== undefined ? firstName : existing.firstName,
      lastName: lastName !== undefined ? lastName : existing.lastName,
      email: email !== undefined ? email : existing.email,
      phone: phone !== undefined ? phone : existing.phone,
      dateOfBirth: dateOfBirth !== undefined ? (dateOfBirth ? new Date(dateOfBirth) : null) : existing.dateOfBirth,
      gender: gender !== undefined ? gender : existing.gender,
      bloodType: bloodType !== undefined ? bloodType : existing.bloodType,
      address: address !== undefined ? address : existing.address,
      emergencyContact: emergencyContact !== undefined ? emergencyContact : existing.emergencyContact,
      emergencyPhone: emergencyPhone !== undefined ? emergencyPhone : existing.emergencyPhone,
      medicalHistory: medicalHistory !== undefined ? medicalHistory : existing.medicalHistory
    };

    const patient = await prisma.patient.update({
      where: { id },
      [DATA_KEY]: updatePayload
    });

    const responseData = { success: true, message: 'تم تحديث المريض بنجاح', ['data']: { patient } };
    res.json(responseData);
  } catch (e) {
    console.error('Update patient error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// DELETE PATIENT
// ===========================================
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const existing = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    }
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'تم حذف المريض' });
  } catch (e) {
    console.error('Delete patient error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;