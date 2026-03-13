const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET ALL
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const where = {};
    if (search) {
      where.OR = [{ description: { contains: search, mode: 'insensitive' } }];
    }
    if (status) where.status = status;

    const findConfig = {
      where: where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, amount: true, description: true, status: true,
        patient: { select: { id: true, firstName: true, lastName: true } },
        createdAt: true, updatedAt: true
      }
    };
    const invoices = await prisma.invoice.findMany(findConfig);
    const countConfig = { where: where };
    const total = await prisma.invoice.count(countConfig);

    const responseData = {
      success: true,
      data: {
        invoices: invoices,
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
    const { patientId, amount, description, status } = req.body;
    if (!patientId || !amount || !description) {
      return res.status(400).json({ success: false, message: 'Patient ID, amount, and description are required' });
    }

    const createConfig = {
      data: {
        patientId: patientId,
        amount: parseFloat(amount),
        description: description,
        status: status || 'PENDING'
      },
      include: { patient: { select: { id: true, firstName: true, lastName: true } } }
    };
    const invoice = await prisma.invoice.create(createConfig);

    const responseData = { success: true, message: 'Invoice created', data: { invoice: invoice } };
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE STATUS
router.patch('/:id/status', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateConfig = {
      where: { id: id },
      data: { status: status }
    };
    const invoice = await prisma.invoice.update(updateConfig);

    const responseData = { success: true, message: 'Status updated', data: { invoice: invoice } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const existingConfig = { where: { id: req.params.id } };
    const existing = await prisma.invoice.findUnique(existingConfig);
    if (!existing) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const deleteConfig = { where: { id: req.params.id } };
    await prisma.invoice.delete(deleteConfig);

    res.json({ success: true, message: 'Invoice deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
