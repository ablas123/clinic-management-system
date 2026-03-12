// ===========================================
// 👨‍⚕️ DOCTORS ROUTES
// ===========================================
// File: backend/src/routes/doctorRoutes.js
// Description: Doctor management endpoints

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// ===========================================
// 📥 GET ALL DOCTORS (Public)
// ===========================================
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, available } = req.query;

    const where = {};

    // 🔍 Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 🟢 Availability filter
    if (available !== undefined) {
      where.isAvailable = available === 'true';
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          specialization: true,
          licenseNumber: true,
          isAvailable: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.doctor.count({ where })
    ]);

    res.json({
      success: true,
       {
        doctors,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (e) {
    console.error('❌ Get doctors error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to fetch doctors' 
    });
  }
});

// ===========================================
// 📥 GET DOCTOR BY ID (Public)
// ===========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        specialization: true,
        licenseNumber: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    res.json({ 
      success: true, 
       { doctor } 
    });

  } catch (e) {
    console.error('❌ Get doctor error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to fetch doctor' 
    });
  }
});

// ===========================================
// 📤 CREATE DOCTOR (Admin only)
// ===========================================
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      specialization, 
      licenseNumber, 
      isAvailable 
    } = req.body;

    // ✅ Validate required fields (matching frontend)
    if (!firstName || !lastName || !email || !specialization) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, email, and specialization are required' 
      });
    }

    // ✅ Check for duplicate email
    const existing = await prisma.doctor.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor with this email already exists' 
      });
    }

    // ✅ Create doctor
    const doctor = await prisma.doctor.create({
       {
        firstName,
        lastName,
        email,
        phone: phone || null,
        specialization,
        licenseNumber: licenseNumber || null,
        isAvailable: isAvailable ?? true
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Doctor created successfully', 
       { doctor } 
    });

  } catch (e) {
    console.error('❌ Create doctor error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to create doctor' 
    });
  }
});

// ===========================================
// ✏️ UPDATE DOCTOR (Admin only)
// ===========================================
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      specialization, 
      licenseNumber, 
      isAvailable 
    } = req.body;

    // ✅ Check if doctor exists
    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    // ✅ Check for duplicate email (if email changed)
    if (email && email !== existing.email) {
      const emailExists = await prisma.doctor.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Doctor with this email already exists' 
        });
      }
    }

    // ✅ Update doctor
    const doctor = await prisma.doctor.update({
      where: { id },
       {
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        specialization: specialization ?? existing.specialization,
        licenseNumber: licenseNumber ?? existing.licenseNumber,
        isAvailable: isAvailable ?? existing.isAvailable
      }
    });

    res.json({ 
      success: true, 
      message: 'Doctor updated successfully', 
       { doctor } 
    });

  } catch (e) {
    console.error('❌ Update doctor error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to update doctor' 
    });
  }
});

// ===========================================
// 🗑️ DELETE DOCTOR (Admin only)
// ===========================================
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Check if doctor exists
    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    // ✅ Delete doctor
    await prisma.doctor.delete({ where: { id } });

    res.json({ 
      success: true, 
      message: 'Doctor deleted successfully' 
    });

  } catch (e) {
    console.error('❌ Delete doctor error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to delete doctor' 
    });
  }
});

// ===========================================
// 🔄 TOGGLE AVAILABILITY (Admin only)
// ===========================================
router.patch('/:id/availability', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    // ✅ Check if doctor exists
    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    // ✅ Update availability
    const doctor = await prisma.doctor.update({
      where: { id },
       { isAvailable }
    });

    res.json({ 
      success: true, 
      message: 'Doctor availability updated', 
       { doctor } 
    });

  } catch (e) {
    console.error('❌ Update availability error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to update availability' 
    });
  }
});

// ===========================================
// 📊 GET DOCTORS STATS (Admin only)
// ===========================================
router.get('/stats/summary', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const [total, available, bySpecialty] = await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { isAvailable: true } }),
      prisma.doctor.groupBy({
        by: ['specialization'],
        _count: { specialization: true }
      })
    ]);

    res.json({
      success: true,
       {
        total,
        available,
        unavailable: total - available,
        bySpecialty: bySpecialty.map(s => ({
          specialization: s.specialization,
          count: s._count.specialization
        }))
      }
    });

  } catch (e) {
    console.error('❌ Get stats error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to fetch stats' 
    });
  }
});

module.exports = router;