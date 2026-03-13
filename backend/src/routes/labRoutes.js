const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET ALL LAB TESTS
router.get('/tests', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;

    const findConfig = {
      where: where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, code: true, category: true, price: true,
        unit: true, referenceRange: true, isFasting: true, turnaroundTime: true,
        createdAt: true, updatedAt: true
      }
    };
    const labTests = await prisma.labTest.findMany(findConfig);
    const countConfig = { where: where };
    const total = await prisma.labTest.count(countConfig);

    const responseData = {
      success: true,
      data: {
        labTests: labTests,
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

// CREATE LAB TEST
router.post('/tests', authenticate, authorize('ADMIN', 'LAB_TECH'), async (req, res) => {
  try {
    const { name, code, category, price, unit, referenceRange, isFasting, turnaroundTime } = req.body;
    if (!name || !code || !category || !price) {
      return res.status(400).json({ success: false, message: 'Name, code, category, and price are required' });
    }

    const createConfig = {
      data: {
        name: name,
        code: code,
        category: category,
        price: parseFloat(price),
        unit: unit || null,
        referenceRange: referenceRange || null,
        isFasting: isFasting === 'true' || isFasting === true,
        turnaroundTime: parseInt(turnaroundTime) || 24
      }
    };
    const labTest = await prisma.labTest.create(createConfig);

    const responseData = { success: true, message: 'Lab test created', data: { labTest: labTest } };
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE LAB TEST
router.delete('/tests/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const existingConfig = { where: { id: req.params.id } };
    const existing = await prisma.labTest.findUnique(existingConfig);
    if (!existing) return res.status(404).json({ success: false, message: 'Lab test not found' });

    const deleteConfig = { where: { id: req.params.id } };
    await prisma.labTest.delete(deleteConfig);

    res.json({ success: true, message: 'Lab test deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
