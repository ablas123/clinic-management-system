const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET ALL
router.get('/', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        amount: true,
        description: true,
        status: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true,  { invoices: invoices } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE - ✅ مع include لرجوع بيانات المريض
router.post('/', async (req, res) => {
  try {
    const { patientId, amount, description } = req.body;
    
    const invoice = await prisma.invoice.create({
       {
        patientId: patientId,
        amount: parseFloat(amount),
        description: description,
        status: 'PENDING'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    res.status(201).json({ success: true,  { invoice: invoice } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, status } = req.body;
    
    const invoice = await prisma.invoice.update({
      where: { id: id },
       {
        amount: amount ? parseFloat(amount) : undefined,
        description: description,
        status: status
      }
    });
    
    res.json({ success: true,  { invoice: invoice } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE STATUS
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const invoice = await prisma.invoice.update({
      where: { id: id },
       { status: status }
    });
    
    res.json({ success: true,  { invoice: invoice } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
