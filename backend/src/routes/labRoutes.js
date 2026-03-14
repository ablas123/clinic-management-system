// File: backend/src/routes/labRoutes.js - PRODUCTION READY (HL7-inspired)
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const prisma = new PrismaClient();
const DATA_KEY = 'data';

// ===========================================
// 🧪 LAB TESTS - إدارة الفحوصات المتاحة
// ===========================================

// GET all lab tests
router.get('/tests', authenticate, authorize('ADMIN', 'DOCTOR', 'LAB_TECH', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const where = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }

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
    console.error('Get lab tests error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE lab test (Admin only)
router.post('/tests', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, code, category, price, unit, referenceRange, isFasting, turnaroundTime, description } = req.body;

    if (!name || !code || !category || !price) {
      return res.status(400).json({ success: false, message: 'الاسم، الرمز، القسم، والسعر مطلوبة' });
    }

    // Check code uniqueness
    const existing = await prisma.labTest.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'رمز الفحص مستخدم بالفعل' });
    }

    const testPayload = {
      name,
      code,
      category,
      price: parseFloat(price),
      unit: unit || null,
      referenceRange: referenceRange || null,
      isFasting: isFasting === 'true' || isFasting === true,
      turnaroundTime: parseInt(turnaroundTime) || 24,
      description: description || null,
      isActive: true
    };

    const labTest = await prisma.labTest.create({ [DATA_KEY]: testPayload });

    // Audit log
    await auditLog(req, 'CREATE', 'LabTest', labTest.id, `Created test: ${name}`);

    const responseData = { success: true, message: 'تم إضافة الفحص', ['data']: { labTest } };
    res.status(201).json(responseData);
  } catch (e) {
    console.error('Create lab test error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE lab test
router.put('/tests/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, category, price, unit, referenceRange, isFasting, turnaroundTime, description, isActive } = req.body;

    const existing = await prisma.labTest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'الفحص غير موجود' });
    }

    const updatePayload = {
      name: name !== undefined ? name : existing.name,
      code: code !== undefined ? code : existing.code,
      category: category !== undefined ? category : existing.category,
      price: price !== undefined ? parseFloat(price) : existing.price,
      unit: unit !== undefined ? unit : existing.unit,
      referenceRange: referenceRange !== undefined ? referenceRange : existing.referenceRange,
      isFasting: isFasting !== undefined ? (isFasting === 'true' || isFasting === true) : existing.isFasting,
      turnaroundTime: turnaroundTime !== undefined ? parseInt(turnaroundTime) : existing.turnaroundTime,
      description: description !== undefined ? description : existing.description,
      isActive: isActive !== undefined ? isActive : existing.isActive
    };

    const labTest = await prisma.labTest.update({
      where: { id },
      [DATA_KEY]: updatePayload
    });

    await auditLog(req, 'UPDATE', 'LabTest', id, `Updated test: ${name || existing.name}`);

    const responseData = { success: true, message: 'تم تحديث الفحص', ['data']: { labTest } };
    res.json(responseData);
  } catch (e) {
    console.error('Update lab test error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE lab test (soft delete via isActive)
router.delete('/tests/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const existing = await prisma.labTest.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'الفحص غير موجود' });
    }

    await prisma.labTest.update({
      where: { id: req.params.id },
      [DATA_KEY]: { isActive: false }
    });

    await auditLog(req, 'DELETE', 'LabTest', req.params.id, `Deleted test: ${existing.name}`);

    res.json({ success: true, message: 'تم تعطيل الفحص' });
  } catch (e) {
    console.error('Delete lab test error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 📋 LAB REQUESTS - طلبات الفحوصات (من الأطباء)
// ===========================================

// GET requests for current user
router.get('/requests', authenticate, authorize('DOCTOR', 'LAB_TECH', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patientId } = req.query;
    const where = {};

    if (status && status !== 'ALL') where.status = status;
    if (patientId) where.patientId = patientId;

    // If DOCTOR, only show their requests
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (doctor) where.doctorId = doctor.id;
    }

    const [requests, total] = await Promise.all([
      prisma.labRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { requestedAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          tests: { select: { id: true, name: true, code: true, price: true } },
          labResults: { select: { id: true, status: true, labTest: { select: { name: true } } } }
        }
      }),
      prisma.labRequest.count({ where })
    ]);

    const responseData = {
      success: true,
      ['data']: {
        requests,
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
    console.error('Get lab requests error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE lab request (Doctor only)
router.post('/requests', authenticate, authorize('DOCTOR'), async (req, res) => {
  try {
    const { patientId, testIds, priority, notes } = req.body;

    if (!patientId || !testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({ success: false, message: 'المريض وقائمة الفحوصات مطلوبة' });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(400).json({ success: false, message: 'المريض غير موجود' });
    }

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
    if (!doctor) {
      return res.status(403).json({ success: false, message: 'ملف الطبيب غير موجود' });
    }

    // Verify tests exist and are active
    const tests = await prisma.labTest.findMany({
      where: { id: { in: testIds }, isActive: true }
    });
    if (tests.length !== testIds.length) {
      return res.status(400).json({ success: false, message: 'بعض الفحوصات غير صالحة' });
    }

    // Calculate total price
    const totalAmount = tests.reduce((sum, t) => sum + parseFloat(t.price), 0);

    // Create lab request
    const requestPayload = {
      patientId,
      doctorId: doctor.id,
      status: 'PENDING',
      priority: priority || 'NORMAL',
      notes: notes || null,
      tests: { connect: testIds.map(id => ({ id })) }
    };

    const labRequest = await prisma.labRequest.create({
      [DATA_KEY]: requestPayload,
      include: { tests: true, patient: { select: { firstName: true, lastName: true } } }
    });

    // Create preliminary lab results for each test
    const resultPayloads = testIds.map(testId => ({
      patientId,
      labTestId: testId,
      requestId: labRequest.id,
      value: '',
      unit: tests.find(t => t.id === testId)?.unit || null,
      referenceRange: tests.find(t => t.id === testId)?.referenceRange || null,
      isAbnormal: false,
      status: 'PENDING'
    }));

    await prisma.labResult.createMany({ [DATA_KEY]: { data: resultPayloads } });

    // Create invoice for lab tests
    const invoicePayload = {
      patientId,
      totalAmount,
      description: `فحوصات مختبر: ${tests.map(t => t.name).join(', ')}`,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    await prisma.invoice.create({ [DATA_KEY]: invoicePayload });

    // Audit log
    await auditLog(req, 'CREATE', 'LabRequest', labRequest.id, `Requested ${tests.length} tests for patient ${patientId}`);

    const responseData = { 
      success: true, 
      message: 'تم طلب الفحوصات + إنشاء فاتورة', 
      ['data']: { labRequest, totalAmount } 
    };
    res.status(201).json(responseData);

  } catch (e) {
    console.error('Create lab request error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE request status (Lab Tech only)
router.patch('/requests/:id/status', authenticate, authorize('LAB_TECH'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.labRequest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const request = await prisma.labRequest.update({
      where: { id },
      [DATA_KEY]: { 
        status,
        completedAt: status === 'COMPLETED' ? new Date() : existing.completedAt
      },
      include: { tests: true }
    });

    await auditLog(req, 'UPDATE', 'LabRequest', id, `Status changed to: ${status}`);

    const responseData = { success: true, message: 'تم تحديث حالة الطلب', ['data']: { request } };
    res.json(responseData);
  } catch (e) {
    console.error('Update request status error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 📊 LAB RESULTS - نتائج الفحوصات
// ===========================================

// GET results for patient (Doctor/Lab Tech)
router.get('/results/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query;

    // Authorization check
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (doctor) {
        // Check if doctor has appointment with this patient
        const hasAccess = await prisma.appointment.findFirst({
          where: { patientId, doctorId: doctor.id }
        });
        if (!hasAccess && req.user.role !== 'ADMIN') {
          return res.status(403).json({ success: false, message: 'غير مصرح لك لعرض نتائج هذا المريض' });
        }
      }
    } else if (!['LAB_TECH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك' });
    }

    const where = { patientId };
    if (status && status !== 'ALL') where.status = status;

    const results = await prisma.labResult.findMany({
      where,
      include: {
        labTest: { select: { name: true, code: true, unit: true, referenceRange: true, isFasting: true } },
        request: { select: { priority: true, notes: true, status: true } },
        technician: { select: { user: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const responseData = { success: true, ['data']: { results } };
    res.json(responseData);
  } catch (e) {
    console.error('Get patient results error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE result (Lab Tech only)
router.patch('/results/:id', authenticate, authorize('LAB_TECH'), async (req, res) => {
  try {
    const { id } = req.params;
    const { value, unit, isAbnormal, notes, status, verifiedBy } = req.body;

    const existing = await prisma.labResult.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'النتيجة غير موجودة' });
    }

    // Auto-detect abnormal if reference range provided and not explicitly set
    let finalIsAbnormal = isAbnormal;
    if (finalIsAbnormal === undefined && existing.referenceRange && value) {
      // Simple numeric range check (can be enhanced)
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const range = existing.referenceRange;
        // Parse "120-160" format
        const match = range.match(/([\d.]+)\s*[-–—]\s*([\d.]+)/);
        if (match) {
          const min = parseFloat(match[1]);
          const max = parseFloat(match[2]);
          finalIsAbnormal = numValue < min || numValue > max;
        }
      }
    }

    const updatePayload = {
      value: value !== undefined ? value : existing.value,
      unit: unit !== undefined ? unit : existing.unit,
      referenceRange: existing.referenceRange,
      isAbnormal: finalIsAbnormal !== undefined ? finalIsAbnormal : existing.isAbnormal,
      status: status || existing.status,
      notes: notes !== undefined ? notes : existing.notes,
      technicianId: req.user.userId,
      verifiedAt: status === 'VERIFIED' ? new Date() : existing.verifiedAt,
      verifiedBy: verifiedBy || existing.verifiedBy
    };

    const result = await prisma.labResult.update({
      where: { id },
      [DATA_KEY]: updatePayload,
      include: { labTest: { select: { name: true } } }
    });

    // If result is verified, update request status if all results are verified
    if (status === 'VERIFIED') {
      const allResults = await prisma.labResult.findMany({
        where: { requestId: existing.requestId }
      });
      const allVerified = allResults.every(r => r.status === 'VERIFIED');
      if (allVerified) {
        await prisma.labRequest.update({
          where: { id: existing.requestId },
          [DATA_KEY]: { status: 'COMPLETED', completedAt: new Date() }
        });
      }
    }

    await auditLog(req, 'UPDATE', 'LabResult', id, `Result updated: ${result.labTest.name}`);

    const responseData = { success: true, message: 'تم تحديث النتيجة', ['data']: { result } };
    res.json(responseData);
  } catch (e) {
    console.error('Update lab result error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET all results for lab dashboard (Lab Tech/Admin)
router.get('/results', authenticate, authorize('LAB_TECH', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const where = {};

    if (status && status !== 'ALL') where.status = status;
    if (priority) {
      where.request = { priority };
    }

    const [results, total] = await Promise.all([
      prisma.labResult.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          labTest: { select: { name: true, code: true, turnaroundTime: true } },
          request: { select: { priority: true, status: true } }
        }
      }),
      prisma.labResult.count({ where })
    ]);

    const responseData = {
      success: true,
      ['data']: {
        results,
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
    console.error('Get all results error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;