// File: backend/src/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const DATA_KEY = 'data';

// ===========================================
// GET ALL INVOICES
// ===========================================
router.get('/', authenticate, authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, patientId } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    // If DOCTOR, only show invoices for their patients
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (doctor) {
        const appointments = await prisma.appointment.findMany({
          where: { doctorId: doctor.id },
          select: { patientId: true }
        });
        where.patientId = { in: appointments.map(a => a.patientId) };
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          appointment: { 
            select: { 
              id: true, 
              date: true, 
              doctor: { 
                include: { user: { select: { firstName: true, lastName: true } } } 
              } 
            } 
          },
          items: true
        }
      }),
      prisma.invoice.count({ where })
    ]);

    const responseData = {
      success: true,
      ['data']: {
        invoices,
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
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// CREATE INVOICE - ✅ مع عناصر الفاتورة
// ===========================================
router.post('/', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { patientId, appointmentId, totalAmount, description, status, items } = req.body;

    if (!patientId || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Patient ID and amount are required' });
    }

    // ✅ 1. إنشاء الفاتورة الرئيسية
    const invoicePayload = {
      patientId,
      appointmentId: appointmentId || null,
      totalAmount: parseFloat(totalAmount),
      paidAmount: 0,
      discount: 0,
      description: description || 'Service charge',
      status: status || 'PENDING',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    const invoiceConfig = { [DATA_KEY]: invoicePayload };
    const invoice = await prisma.invoice.create(invoiceConfig);

    // ✅ 2. إضافة عناصر الفاتورة إذا وُجدت
    if (items && Array.isArray(items) && items.length > 0) {
      const itemPayloads = items.map(item => ({
        invoiceId: invoice.id,
        description: item.description,
        quantity: parseInt(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice),
        total: parseFloat(item.unitPrice) * (parseInt(item.quantity) || 1),
        type: item.type || 'SERVICE'
      }));
      
      await prisma.invoiceItem.createMany({
        [DATA_KEY]: { data: itemPayloads }
      });
    }

    const responseData = { 
      success: true, 
      message: 'Invoice created', 
      ['data']: { invoice } 
    };
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// UPDATE PAYMENT STATUS - ✅ مع تسجيل وقت الدفع
// ===========================================
router.patch('/:id/payment', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paidAmount, paymentMethod } = req.body;

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const updatePayload = {
      status: status || existing.status,
      paidAmount: paidAmount !== undefined ? parseFloat(paidAmount) : existing.paidAmount,
      paymentMethod: paymentMethod || existing.paymentMethod,
      paidAt: status === 'PAID' ? new Date() : existing.paidAt
    };
    const updateConfig = { where: { id }, [DATA_KEY]: updatePayload };
    const invoice = await prisma.invoice.update(updateConfig);

    // ✅ إذا دُفعت الفاتورة كاملة، تحديث موعد مرتبط إن وُجد
    if (status === 'PAID' && invoice.paidAmount >= invoice.totalAmount && invoice.appointmentId) {
      await prisma.appointment.update({
        where: { id: invoice.appointmentId },
        [DATA_KEY]: { status: 'COMPLETED' }
      });
    }

    const responseData = { 
      success: true, 
      message: 'Payment updated', 
      ['data']: { invoice } 
    };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// DELETE INVOICE
// ===========================================
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
