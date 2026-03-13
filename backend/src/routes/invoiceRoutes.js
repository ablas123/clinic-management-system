// ===========================================
// 💰 INVOICES ROUTES - FINAL CORRECTED VERSION
// ===========================================
// File: backend/src/routes/invoiceRoutes.js
// ✅ جميع استعلامات Prisma تحتوي على data: قبل {

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ===========================================
// 📥 GET ALL INVOICES
// ===========================================
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          description: true,
          status: true,
          dueDate: true,
          patient: {
            select: {
              id: true,
              name: true  // ✅ استخدم name وليس firstName
            }
          },
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({
      success: true,
      data: {  // ✅ data: هنا
        invoices,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (e) {
    console.error('❌ Get all invoices error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to fetch invoices' });
  }
});

// ===========================================
// 📥 GET INVOICE BY ID
// ===========================================
router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        amount: true,
        description: true,
        status: true,
        dueDate: true,
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: { invoice } });  // ✅ data: هنا
  } catch (e) {
    console.error('❌ Get invoice error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to fetch invoice' });
  }
});

// ===========================================
// 📤 CREATE INVOICE
// ===========================================
router.post('/', async (req, res) => {
  try {
    const { patientId, amount, description, status, dueDate } = req.body;

    if (!patientId || !amount || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Patient ID, amount, and description are required' 
      });
    }

    // ✅ CREATE: data: قبل {
    const invoice = await prisma.invoice.create({
      data: {  // ← ✅ هذا هو الصحيح
        patientId,
        amount: parseFloat(amount),
        description,
        status: status || 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Invoice created successfully', 
      data: { invoice } 
    });
  } catch (e) {
    console.error('❌ Create invoice error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to create invoice' 
    });
  }
});

// ===========================================
// ✏️ UPDATE INVOICE
// ===========================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, status, dueDate } = req.body;

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // ✅ UPDATE: data: قبل {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {  // ← ✅ هذا هو الصحيح
        amount: amount ? parseFloat(amount) : existing.amount,
        description: description ?? existing.description,
        status: status ?? existing.status,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate
      }
    });
    res.json({ success: true, message: 'Invoice updated', data: { invoice } });
  } catch (e) {
    console.error('❌ Update invoice error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to update invoice' });
  }
});

// ===========================================
// 🗑️ DELETE INVOICE
// ===========================================
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (e) {
    console.error('❌ Delete invoice error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to delete invoice' });
  }
});

// ===========================================
// 🔄 UPDATE INVOICE STATUS
// ===========================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    // ✅ UPDATE: data: قبل {
    const invoice = await prisma.invoice.update({ 
      where: { id }, 
      data: { status }  // ← ✅ هذا هو الصحيح
    });
    res.json({ success: true, message: 'Status updated', data: { invoice } });
  } catch (e) {
    console.error('❌ Update status error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to update status' });
  }
});

module.exports = router;