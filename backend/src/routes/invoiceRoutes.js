// File: backend/src/routes/labRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const DATA_KEY = 'data';

// ===========================================
// GET ALL LAB TESTS
// ===========================================
router.get('/tests', authenticate, authorize('ADMIN', 'DOCTOR', 'LAB_TECH', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const where = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;

    const [labTests, total] = await Promise.all([
      prisma.labTest.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.labTest.count({ where })
    ]);

    const responseData = {
      success: true,
      ['data']: {
        labTests,
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
// CREATE LAB REQUEST - ✅ من قبل الطبيب
// ===========================================
router.post('/requests', authenticate, authorize('DOCTOR'), async (req, res) => {
  try {
    const { patientId, testIds, priority, notes } = req.body;

    if (!patientId || !testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient ID and test IDs are required' });
    }

    // ✅ 1. جلب ملف الطبيب
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
    if (!doctor) {
      return res.status(403).json({ success: false, message: 'Doctor profile not found' });
    }

    // ✅ 2. إنشاء طلب المختبر
    const requestPayload = {
      patientId,
      doctorId: doctor.id,
      status: 'PENDING',
      priority: priority || 'NORMAL',
      notes: notes || null,
      tests: { connect: testIds.map(id => ({ id })) }
    };
    const requestConfig = { [DATA_KEY]: requestPayload, include: { tests: true } };
    const labRequest = await prisma.labRequest.create(requestConfig);

    // ✅ 3. إنشاء نتائج مبدئية لكل فحص
    const resultPayloads = testIds.map(testId => ({
      patientId,
      labTestId: testId,
      requestId: labRequest.id,
      value: '',
      status: 'PENDING',
      isAbnormal: false
    }));

    await prisma.labResult.createMany({
      [DATA_KEY]: { data: resultPayloads }
    });

    // ✅ 4. توليد فاتورة للفحوصات
    const tests = await prisma.labTest.findMany({
      where: { id: { in: testIds } },
      select: { price: true, name: true }
    });
    const totalAmount = tests.reduce((sum, t) => sum + parseFloat(t.price), 0);

    const invoicePayload = {
      patientId,
      totalAmount,
      description: `فحوصات مختبر: ${tests.map(t => t.name).join(', ')}`,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    const invoiceConfig = { [DATA_KEY]: invoicePayload };
    await prisma.invoice.create(invoiceConfig);

    const responseData = { 
      success: true, 
      message: 'Lab request created + invoice generated', 
      ['data']: { labRequest } 
    };
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// UPDATE LAB RESULT - ✅ من قبل فني المختبر
// ===========================================
router.patch('/results/:id', authenticate, authorize('LAB_TECH'), async (req, res) => {
  try {
    const { id } = req.params;
    const { value, unit, isAbnormal, notes, status } = req.body;

    const existing = await prisma.labResult.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Lab result not found' });
    }

    const updatePayload = {
      value: value !== undefined ? value : existing.value,
      unit: unit !== undefined ? unit : existing.unit,
      referenceRange: existing.referenceRange,
      isAbnormal: isAbnormal !== undefined ? (isAbnormal === true || isAbnormal === 'true') : existing.isAbnormal,
      status: status || existing.status,
      notes: notes !== undefined ? notes : existing.notes,
      technicianId: req.user.userId,
      verifiedAt: status === 'VERIFIED' ? new Date() : existing.verifiedAt
    };
    const updateConfig = { where: { id }, [DATA_KEY]: updatePayload };
    const result = await prisma.labResult.update(updateConfig);

    // ✅ إذا وُثّقت النتيجة، تحديث حالة الطلب
    if (status === 'VERIFIED') {
      await prisma.labRequest.update({
        where: { id: existing.requestId },
        [DATA_KEY]: { status: 'COMPLETED', completedAt: new Date() }
      });
    }

    const responseData = { 
      success: true, 
      message: 'Result updated', 
      ['data']: { result } 
    };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// GET PATIENT LAB RESULTS - ✅ للطبيب أو المريض
// ===========================================
router.get('/results/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query;

    // التحقق من الصلاحية
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (doctor) {
        const hasAppointment = await prisma.appointment.findFirst({
          where: { patientId, doctorId: doctor.id }
        });
        if (!hasAppointment && req.user.role !== 'ADMIN') {
          return res.status(403).json({ success: false, message: 'Not authorized for this patient' });
        }
      }
    } else if (req.user.role !== 'ADMIN' && req.user.role !== 'LAB_TECH') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const where = { patientId };
    if (status) where.status = status;

    const results = await prisma.labResult.findMany({
      where,
      include: {
        labTest: { select: { name: true, code: true, unit: true, referenceRange: true } },
        request: { select: { priority: true, notes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const responseData = { success: true, ['data']: { results } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
