const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ===========================================
// GET ALL LAB TESTS
// ===========================================
router.get('/tests', async (req, res) => {
  try {
    const labTests = await prisma.labTest.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        price: true,
        unit: true,
        referenceRange: true,
        isFasting: true,
        turnaroundTime: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const responseData = { success: true, data: { labTests: labTests } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// GET LAB TEST BY ID
// ===========================================
router.get('/tests/:id', async (req, res) => {
  try {
    const labTest = await prisma.labTest.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        price: true,
        unit: true,
        referenceRange: true,
        isFasting: true,
        turnaroundTime: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!labTest) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }
    
    const responseData = { success: true, data: { labTest: labTest } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// CREATE LAB TEST - ✅ مع include آمن
// ===========================================
router.post('/tests', async (req, res) => {
  try {
    const { name, code, category, price, unit, referenceRange, isFasting, turnaroundTime } = req.body;
    
    if (!name || !code || !category || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, code, category, and price are required' 
      });
    }
    
    const labTest = await prisma.labTest.create({
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
    });
    
    const responseData = { success: true, data: { labTest: labTest } };
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// UPDATE LAB TEST
// ===========================================
router.put('/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, category, price, unit, referenceRange, isFasting, turnaroundTime } = req.body;
    
    const existing = await prisma.labTest.findUnique({ where: { id: id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }
    
    const labTest = await prisma.labTest.update({
      where: { id: id },
      data: {
        name: name !== undefined ? name : existing.name,
        code: code !== undefined ? code : existing.code,
        category: category !== undefined ? category : existing.category,
        price: price !== undefined ? parseFloat(price) : existing.price,
        unit: unit !== undefined ? unit : existing.unit,
        referenceRange: referenceRange !== undefined ? referenceRange : existing.referenceRange,
        isFasting: isFasting !== undefined ? (isFasting === 'true' || isFasting === true) : existing.isFasting,
        turnaroundTime: turnaroundTime !== undefined ? parseInt(turnaroundTime) : existing.turnaroundTime
      }
    });
    
    const responseData = { success: true, data: { labTest: labTest } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// DELETE LAB TEST
// ===========================================
router.delete('/tests/:id', async (req, res) => {
  try {
    const existing = await prisma.labTest.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }
    await prisma.labTest.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Lab test deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
