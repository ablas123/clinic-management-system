const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET ALL
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

    const config = {
      where: where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        dateOfBirth: true, gender: true, bloodType: true, address: true,
        createdAt: true, updatedAt: true
      }
    };
    const patients = await prisma.patient.findMany(config);
    const countConfig = { where: where };
    const total = await prisma.patient.count(countConfig);

    const responseData = {
      success: true,
      data: {
        patients: patients,
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
router.post('/', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, gender, bloodType, address } = req.body;
    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ success: false, message: 'First name, last name, and phone are required' });
    }

    const createConfig = {
      data: {
        firstName: firstName, lastName: lastName, email: email || null, phone: phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null, bloodType: bloodType || null, address: address || null
      }
    };
    const patient = await prisma.patient.create(createConfig);

    const responseData = { success: true, message: 'Patient created', data: { patient: patient } };
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET BY ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const findConfig = {
      where: { id: req.params.id },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        dateOfBirth: true, gender: true, bloodType: true, address: true,
        createdAt: true, updatedAt: true
      }
    };
    const patient = await prisma.patient.findUnique(findConfig);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const responseData = { success: true, data: { patient: patient } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE
router.put('/:id', authenticate, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, dateOfBirth, gender, bloodType, address } = req.body;

    const existingConfig = { where: { id: id } };
    const existing = await prisma.patient.findUnique(existingConfig);
    if (!existing) return res.status(404).json({ success: false, message: 'Patient not found' });

    const updateConfig = {
      where: { id: id },
      data: {
        firstName: firstName !== undefined ? firstName : existing.firstName,
        lastName: lastName !== undefined ? lastName : existing.lastName,
        email: email !== undefined ? email : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        dateOfBirth: dateOfBirth !== undefined ? (dateOfBirth ? new Date(dateOfBirth) : null) : existing.dateOfBirth,
        gender: gender !== undefined ? gender : existing.gender,
        bloodType: bloodType !== undefined ? bloodType : existing.bloodType,
        address: address !== undefined ? address : existing.address
      }
    };
    const patient = await prisma.patient.update(updateConfig);

    const responseData = { success: true, message: 'Patient updated', data: { patient: patient } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const existingConfig = { where: { id: req.params.id } };
    const existing = await prisma.patient.findUnique(existingConfig);
    if (!existing) return res.status(404).json({ success: false, message: 'Patient not found' });

    const deleteConfig = { where: { id: req.params.id } };
    await prisma.patient.delete(deleteConfig);

    res.json({ success: true, message: 'Patient deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
