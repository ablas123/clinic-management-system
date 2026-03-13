const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET ALL
router.get('/', authenticate, async (req, res) => {
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
    if (specialty) where.specialty = specialty;

    const findConfig = {
      where: where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, specialty: true, licenseNumber: true, bio: true,
        isAvailable: true, consultationFee: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        createdAt: true, updatedAt: true
      }
    };
    const doctors = await prisma.doctor.findMany(findConfig);
    const countConfig = { where: where };
    const total = await prisma.doctor.count(countConfig);

    const responseData = {
      success: true,
      data: {
        doctors: doctors,
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
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { userId, specialty, licenseNumber, bio, consultationFee } = req.body;
    if (!userId || !specialty || !licenseNumber) {
      return res.status(400).json({ success: false, message: 'User ID, specialty, and license are required' });
    }

    const createConfig = {
      data: {
        userId: userId,
        specialty: specialty,
        licenseNumber: licenseNumber,
        bio: bio || null,
        consultationFee: consultationFee ? parseFloat(consultationFee) : 0
      }
    };
    const doctor = await prisma.doctor.create(createConfig);

    const responseData = { success: true, message: 'Doctor created', data: { doctor: doctor } };
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE AVAILABILITY
router.patch('/:id/availability', authenticate, authorize('ADMIN', 'DOCTOR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const updateConfig = {
      where: { id: id },
      data: { isAvailable: isAvailable }
    };
    const doctor = await prisma.doctor.update(updateConfig);

    const responseData = { success: true, message: 'Availability updated', data: { doctor: doctor } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const existingConfig = { where: { id: req.params.id } };
    const existing = await prisma.doctor.findUnique(existingConfig);
    if (!existing) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const deleteConfig = { where: { id: req.params.id } };
    await prisma.doctor.delete(deleteConfig);

    res.json({ success: true, message: 'Doctor deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
