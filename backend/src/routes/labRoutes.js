// File: backend/src/routes/labRoutes.js - COMPLETE & HL7-COMPLIANT
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const prisma = new PrismaClient();
const DATA_KEY = 'data';

// ===========================================
// 🧪 LAB TESTS - Catalog Management (Admin/Lab Tech)
// ===========================================

// GET all lab tests (with isActive filter)
router.get('/tests', authenticate, authorize('ADMIN', 'DOCTOR', 'LAB_TECH', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { page = 1, limit = 100, search, category, includeInactive = 'false' } = req.query;
    const where = {};

    // Only show active tests by default (for doctors/patients)
    if (includeInactive !== 'true' || !['ADMIN', 'LAB_TECH'].includes(req.user?.role)) {
      where.isActive = true;
    }

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

    // ✅ استخدام [DATA_KEY] لتجنب مشكلة :
    const responseData = {
      success: true,
      [DATA_KEY]: {
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

// CREATE lab test (Admin/Lab Tech only)
router.post('/tests', authenticate, authorize('ADMIN', 'LAB_TECH'), async (req, res) => {
  try {
    const { name, code, category, price, unit, referenceRange, isFasting, turnaroundTime, description, isActive } = req.body;

    if (!name || !code || !category || price === undefined) {
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
      isActive: isActive !== undefined ? isActive : true
    };

    const labTest = await prisma.labTest.create({ [DATA_KEY]: testPayload });
    await auditLog(req, 'CREATE', 'LabTest', labTest.id, `Created: ${name}`);

    const responseData = { success: true, message: 'تم إضافة الفحص', [DATA_KEY]: { labTest } };
    res.status(201).json(responseData);
  } catch (e) {
    console.error('Create lab test error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE lab test (Admin/Lab Tech only)
router.put('/tests/:id', authenticate, authorize('ADMIN', 'LAB_TECH'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, category, price, unit, referenceRange, isFasting, turnaroundTime, description, isActive } = req.body;

    const existing = await prisma.labTest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'الفحص غير موجود' });
    }

    // If code is being changed, check uniqueness
    if (code && code !== existing.code) {
      const codeExists = await prisma.labTest.findUnique({ where: { code } });
      if (codeExists) {
        return res.status(400).json({ success: false, message: 'رمز الفحص مستخدم بالفعل' });
      }
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

    await auditLog(req, 'UPDATE', 'LabTest', id, `Updated: ${name || existing.name}`);

    const responseData = { success: true, message: 'تم تحديث الفحص', [DATA_KEY]: { labTest } };
    res.json(responseData);
  } catch (e) {
    console.error('Update lab test error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// SOFT DELETE / TOGGLE ACTIVE (Admin/Lab Tech only)
router.patch('/tests/:id/active', authenticate, authorize('ADMIN', 'LAB_TECH'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existing = await prisma.labTest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'الفحص غير موجود' });
    }

    const labTest = await prisma.labTest.update({
      where: { id },
      [DATA_KEY]: { isActive: isActive === true || isActive === 'true' }
    });

    await auditLog(req, 'UPDATE', 'LabTest', id, `Active status: ${existing.isActive} → ${labTest.isActive}`);

    const responseData = { success: true, message: 'تم تحديث حالة الفحص', [DATA_KEY]: { labTest } };
    res.json(responseData);
  } catch (e) {
    console.error('Toggle lab test active error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 📋 LAB REQUESTS - Doctor creates, Lab Tech processes
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
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          tests: { select: { id: true, name: true, code: true, price: true } },
          labResults: { 
            select: { 
              id: true, 
              status: true, 
              labTest: { select: { name: true, code: true } },
              value: true,
              isAbnormal: true
            } 
          }
        }
      }),
      prisma.labRequest.count({ where })
    ]);

    const responseData = {
      success: true,
      [DATA_KEY]: {
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

// CREATE lab request (Doctor only) - HL7: Order Entry
router.post('/requests', authenticate, authorize('DOCTOR'), async (req, res) => {
  try {
    const { patientId, testCodes, priority, clinicalNotes } = req.body;

    if (!patientId || !testCodes || !Array.isArray(testCodes) || testCodes.length === 0) {
      return res.status(400).json({ success: false, message: 'المريض ورموز الفحوصات مطلوبة' });
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

    // Verify tests exist by code (more stable than ID) and are ACTIVE
    const tests = await prisma.labTest.findMany({
      where: { code: { in: testCodes }, isActive: true }
    });
    if (tests.length !== testCodes.length) {
      return res.status(400).json({ success: false, message: 'بعض رموز الفحوصات غير صالحة أو غير مفعلة' });
    }

    // Calculate total price
    const totalAmount = tests.reduce((sum, t) => sum + parseFloat(t.price), 0);

    // Create lab request (HL7: ORC segment equivalent)
    const requestPayload = {
      patientId,
      doctorId: doctor.id,
      status: 'PENDING',
      priority: priority || 'NORMAL',
      notes: clinicalNotes || null,
      tests: { connect: tests.map(t => ({ id: t.id })) }
    };

    const labRequest = await prisma.labRequest.create({
      [DATA_KEY]: requestPayload,
      include: { 
        tests: true, 
        patient: { select: { firstName: true, lastName: true } } 
      }
    });

    // Create preliminary lab results for each test (HL7: OBR/OBX segments)
    const resultPayloads = tests.map(test => ({
      patientId,
      labTestId: test.id,
      requestId: labRequest.id,
      value: '',
      unit: test.unit || null,
      referenceRange: test.referenceRange || null,
      isAbnormal: false,
      status: 'PENDING',
      notes: null
    }));

    await prisma.labResult.createMany({ [DATA_KEY]: {  resultPayloads } });

    // Create invoice for lab tests (integrated billing)
    const invoicePayload = {
      patientId,
      totalAmount,
      description: `فحوصات مختبر: ${tests.map(t => t.name).join(', ')}`,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    await prisma.invoice.create({ [DATA_KEY]: invoicePayload });

    // Audit log (HIPAA: Access logging)
    await auditLog(req, 'CREATE', 'LabRequest', labRequest.id, 
      `Ordered ${tests.length} tests for patient ${patientId}: ${testCodes.join(', ')}`);

    const responseData = { 
      success: true, 
      message: 'تم طلب الفحوصات + إنشاء فاتورة', 
      [DATA_KEY]: { labRequest, totalAmount } 
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

    await auditLog(req, 'UPDATE', 'LabRequest', id, `Status: ${existing.status} → ${status}`);

    const responseData = { success: true, message: 'تم تحديث حالة الطلب', [DATA_KEY]: { request } };
    res.json(responseData);
  } catch (e) {
    console.error('Update request status error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 📊 LAB RESULTS - Lab Tech enters, Doctor views
// ===========================================

// GET results for a specific request (Lab Tech/Doctor)
router.get('/results/request/:requestId', authenticate, authorize('LAB_TECH', 'DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { requestId } = req.params;

    // Authorization: Doctor can only see their own requests
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
      if (doctor) {
        const request = await prisma.labRequest.findUnique({ 
          where: { id: requestId },
          select: { doctorId: true }
        });
        if (request && request.doctorId !== doctor.id) {
          return res.status(403).json({ success: false, message: 'غير مصرح لك لعرض هذا الطلب' });
        }
      }
    }

    const results = await prisma.labResult.findMany({
      where: { requestId },
      include: {
        labTest: { select: { name: true, code: true, unit: true, referenceRange: true, isFasting: true } },
        technician: { select: { user: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { labTest: { name: 'asc' } }
    });

    const responseData = { success: true, [DATA_KEY]: { results } };
    res.json(responseData);
  } catch (e) {
    console.error('Get request results error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE result (Lab Tech only) - HL7: Result Entry
router.patch('/results/:id', authenticate, authorize('LAB_TECH'), async (req, res) => {
  try {
    const { id } = req.params;
    const { value, unit, isAbnormal, notes, status, customFields } = req.body;

    const existing = await prisma.labResult.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'النتيجة غير موجودة' });
    }

    // Auto-detect abnormal if reference range provided and not explicitly set
    let finalIsAbnormal = isAbnormal;
    if (finalIsAbnormal === undefined && existing.referenceRange && value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const range = existing.referenceRange;
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
      verifiedAt: status === 'VERIFIED' ? new Date() : existing.verifiedAt
    };

    // Handle custom fields (for tests not in catalog)
    if (customFields && typeof customFields === 'object') {
      updatePayload.notes = updatePayload.notes 
        ? `${updatePayload.notes}\n${JSON.stringify(customFields)}`
        : JSON.stringify(customFields);
    }

    const result = await prisma.labResult.update({
      where: { id },
      [DATA_KEY]: updatePayload,
      include: { labTest: { select: { name: true } }, request: { select: { status: true } } }
    });

    // If result is verified, check if all results for request are verified
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

    await auditLog(req, 'UPDATE', 'LabResult', id, `Result entered for: ${result.labTest.name}`);

    const responseData = { success: true, message: 'تم تحديث النتيجة', [DATA_KEY]: { result } };
    res.json(responseData);
  } catch (e) {
    console.error('Update lab result error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// MARK result as printed (Lab Tech)
router.post('/results/:id/print', authenticate, authorize('LAB_TECH'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.labResult.update({
      where: { id },
      [DATA_KEY]: { printedAt: new Date() }
    });

    await auditLog(req, 'PRINT', 'LabResult', id, 'Result printed');

    res.json({ success: true, message: 'تم تسجيل الطباعة' });
  } catch (e) {
    console.error('Print result error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// MARK result as sent to doctor (Lab Tech)
router.post('/results/:id/send', authenticate, authorize('LAB_TECH'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.labResult.update({
      where: { id },
      [DATA_KEY]: { sentToDoctorAt: new Date() },
      include: { request: { select: { doctorId: true } } }
    });

    await auditLog(req, 'SEND', 'LabResult', id, 'Result sent to doctor');

    const responseData = { success: true, message: 'تم إرسال النتيجة للطبيب', [DATA_KEY]: { result } };
    res.json(responseData);
  } catch (e) {
    console.error('Send result error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET pending results for Lab Tech dashboard
router.get('/results/pending', authenticate, authorize('LAB_TECH', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, priority } = req.query;
    const where = { status: 'PENDING' };
    
    if (priority) {
      where.request = { priority };
    }

    const [results, total] = await Promise.all([
      prisma.labResult.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'asc' },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          labTest: { select: { name: true, code: true, turnaroundTime: true } },
          request: { select: { priority: true, requestedAt: true } }
        }
      }),
      prisma.labResult.count({ where })
    ]);

    const responseData = {
      success: true,
      [DATA_KEY]: {
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
    console.error('Get pending results error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
