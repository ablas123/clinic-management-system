// ===========================================
// 🧪 LABORATORY CONTROLLER
// ===========================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ===========================================
// 🧪 LAB TEST TYPES (Test Categories)
// ===========================================

// -------------------------------------------
// GET ALL LAB TESTS (With Filters)
// -------------------------------------------

exports.getAllLabTests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const isActive = req.query.isActive;
    const skip = (page - 1) * limit;

    // Build filters
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get total count for pagination
    const total = await prisma.labTest.count({ where });

    // Get lab tests with pagination
    const labTests = await prisma.labTest.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        description: true,
        price: true,
        unit: true,
        referenceRange: true,
        isFasting: true,
        turnaroundTime: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: labTests.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { labTests }
    });

  } catch (error) {
    console.error('❌ Get all lab tests error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab tests',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// GET SINGLE LAB TEST BY ID
// -------------------------------------------

exports.getLabTestById = async (req, res) => {
  try {
    const { id } = req.params;

    const labTest = await prisma.labTest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        description: true,
        price: true,
        unit: true,
        referenceRange: true,
        minRange: true,
        maxRange: true,
        isFasting: true,
        turnaroundTime: true,
        fields: true,
        isActive: true,
        labResults: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!labTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: { labTest }
    });

  } catch (error) {
    console.error('❌ Get lab test by ID error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab test',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// CREATE NEW LAB TEST
// -------------------------------------------

exports.createLabTest = async (req, res) => {
  try {
    const {
      name,
      code,
      category,
      description,
      price,
      unit,
      referenceRange,
      minRange,
      maxRange,
      isFasting,
      turnaroundTime,
      fields
    } = req.body;

    // 1. Validate required fields
    if (!name || !code || !category || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, category, and price are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // 2. Validate price
    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than zero',
        error: 'INVALID_PRICE'
      });
    }

    // 3. Check if code already exists
    const existingTest = await prisma.labTest.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingTest) {
      return res.status(409).json({
        success: false,
        message: 'Lab test with this code already exists',
        error: 'TEST_EXISTS'
      });
    }

    // 4. Create lab test
    const labTest = await prisma.labTest.create({
      data: {
        name,
        code: code.toUpperCase(),
        category,
        description,
        price: parseFloat(price),
        unit,
        referenceRange,
        minRange: minRange ? parseFloat(minRange) : null,
        maxRange: maxRange ? parseFloat(maxRange) : null,
        isFasting: isFasting || false,
        turnaroundTime: turnaroundTime ? parseInt(turnaroundTime) : null,
        fields: fields || null
      },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        price: true,
        unit: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Lab test created successfully',
      data: { labTest }
    });

  } catch (error) {
    console.error('❌ Create lab test error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create lab test',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// UPDATE LAB TEST
// -------------------------------------------

exports.updateLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      category,
      description,
      price,
      unit,
      referenceRange,
      minRange,
      maxRange,
      isFasting,
      turnaroundTime,
      fields,
      isActive
    } = req.body;

    // 1. Check if lab test exists
    const existingTest = await prisma.labTest.findUnique({
      where: { id }
    });

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check code uniqueness if code is being updated
    if (code && code.toUpperCase() !== existingTest.code) {
      const codeExists = await prisma.labTest.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (codeExists) {
        return res.status(409).json({
          success: false,
          message: 'Lab test with this code already exists',
          error: 'CODE_EXISTS'
        });
      }
    }

    // 3. Update lab test
    const labTest = await prisma.labTest.update({
      where: { id },
      data: {
        name,
        code: code ? code.toUpperCase() : undefined,
        category,
        description,
        price: price ? parseFloat(price) : undefined,
        unit,
        referenceRange,
        minRange: minRange ? parseFloat(minRange) : undefined,
        maxRange: maxRange ? parseFloat(maxRange) : undefined,
        isFasting: isFasting !== undefined ? isFasting : undefined,
        turnaroundTime: turnaroundTime ? parseInt(turnaroundTime) : undefined,
        fields,
        isActive: isActive !== undefined ? isActive : undefined
      },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        price: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Lab test updated successfully',
      data: { labTest }
    });

  } catch (error) {
    console.error('❌ Update lab test error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update lab test',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// DELETE LAB TEST
// -------------------------------------------

exports.deleteLabTest = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if lab test exists
    const existingTest = await prisma.labTest.findUnique({
      where: { id }
    });

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check if test has results (soft delete instead)
    const resultCount = await prisma.labResult.count({
      where: { testId: id }
    });

    if (resultCount > 0) {
      // Soft delete - just deactivate
      await prisma.labTest.update({
        where: { id },
        data: { isActive: false }
      });

      return res.status(200).json({
        success: true,
        message: 'Lab test deactivated (has existing results)',
        data: { softDeleted: true }
      });
    }

    // 3. Delete lab test
    await prisma.labTest.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Lab test deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete lab test error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lab test',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// TOGGLE LAB TEST AVAILABILITY
// -------------------------------------------

exports.toggleLabTestAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if lab test exists
    const labTest = await prisma.labTest.findUnique({
      where: { id }
    });

    if (!labTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Toggle availability
    const updatedTest = await prisma.labTest.update({
      where: { id },
      data: { isActive: !labTest.isActive },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true
      }
    });

    res.status(200).json({
      success: true,
      message: `Lab test is now ${updatedTest.isActive ? 'active' : 'inactive'}`,
      data: { labTest: updatedTest }
    });

  } catch (error) {
    console.error('❌ Toggle availability error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle availability',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 📊 LAB RESULTS (Patient Test Results)
// ===========================================

// -------------------------------------------
// GET ALL LAB RESULTS (With Filters)
// -------------------------------------------

exports.getAllLabResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const patientId = req.query.patientId || '';
    const testId = req.query.testId || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const skip = (page - 1) * limit;

    // Build filters
    const where = {};

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (testId) {
      where.testId = testId;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate);
      }
    }

    // Get total count for pagination
    const total = await prisma.labResult.count({ where });

    // Get lab results with pagination
    const labResults = await prisma.labResult.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        notes: true,
        attachments: true,
        collectedAt: true,
        completedAt: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        test: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: labResults.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { labResults }
    });

  } catch (error) {
    console.error('❌ Get all lab results error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab results',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// GET SINGLE LAB RESULT BY ID
// -------------------------------------------

exports.getLabResultById = async (req, res) => {
  try {
    const { id } = req.params;

    const labResult = await prisma.labResult.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        results: true,
        notes: true,
        attachments: true,
        collectedAt: true,
        completedAt: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true
          }
        },
        test: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
            unit: true,
            referenceRange: true,
            minRange: true,
            maxRange: true,
            fields: true
          }
        },
        appointment: {
          select: {
            id: true,
            date: true,
            doctor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!labResult) {
      return res.status(404).json({
        success: false,
        message: 'Lab result not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: { labResult }
    });

  } catch (error) {
    console.error('❌ Get lab result by ID error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab result',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// CREATE LAB RESULT (Order a Test)
// -------------------------------------------

exports.createLabResult = async (req, res) => {
  try {
    const { patientId, appointmentId, testId, notes, orderedBy } = req.body;

    // 1. Validate required fields
    if (!patientId || !testId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and test ID are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // 2. Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        error: 'PATIENT_NOT_FOUND'
      });
    }

    // 3. Check if lab test exists and is active
    const labTest = await prisma.labTest.findUnique({
      where: { id: testId }
    });

    if (!labTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found',
        error: 'TEST_NOT_FOUND'
      });
    }

    if (!labTest.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This lab test is currently inactive',
        error: 'TEST_INACTIVE'
      });
    }

    // 4. Check appointment if provided
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
          error: 'APPOINTMENT_NOT_FOUND'
        });
      }
    }

    // 5. Create lab result
    const labResult = await prisma.labResult.create({
      data: {
        patientId,
        appointmentId,
        testId,
        notes,
        orderedBy,
        status: 'PENDING'
      },
      select: {
        id: true,
        status: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        test: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Lab test ordered successfully',
      data: { labResult }
    });

  } catch (error) {
    console.error('❌ Create lab result error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to order lab test',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// UPDATE LAB RESULT STATUS
// -------------------------------------------

exports.updateLabResultStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, collectedAt } = req.body;

    // 1. Check if lab result exists
    const labResult = await prisma.labResult.findUnique({
      where: { id }
    });

    if (!labResult) {
      return res.status(404).json({
        success: false,
        message: 'Lab result not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Validate status
    const validStatuses = ['PENDING', 'COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CRITICAL'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        error: 'INVALID_STATUS'
      });
    }

    // 3. Update status
    const updatedResult = await prisma.labResult.update({
      where: { id },
      data: {
        status,
        collectedAt: collectedAt ? new Date(collectedAt) : undefined
      },
      select: {
        id: true,
        status: true,
        collectedAt: true,
        test: {
          select: {
            name: true,
            code: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Lab result status updated successfully',
      data: { labResult: updatedResult }
    });

  } catch (error) {
    console.error('❌ Update lab result status error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update lab result status',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// COMPLETE LAB RESULT (Add Results)
// -------------------------------------------

exports.completeLabResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { results, notes, attachments, completedBy } = req.body;

    // 1. Check if lab result exists
    const labResult = await prisma.labResult.findUnique({
      where: { id }
    });

    if (!labResult) {
      return res.status(404).json({
        success: false,
        message: 'Lab result not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check if already completed
    if (labResult.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Lab result is already completed',
        error: 'ALREADY_COMPLETED'
      });
    }

    // 3. Complete lab result
    const completedResult = await prisma.labResult.update({
      where: { id },
      data: {
        results,
        notes,
        attachments: attachments || [],
        completedBy,
        status: 'COMPLETED',
        completedAt: new Date()
      },
      select: {
        id: true,
        status: true,
        results: true,
        notes: true,
        attachments: true,
        completedAt: true,
        test: {
          select: {
            name: true,
            code: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Lab result completed successfully',
      data: { labResult: completedResult }
    });

  } catch (error) {
    console.error('❌ Complete lab result error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to complete lab result',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// CANCEL LAB RESULT
// -------------------------------------------

exports.cancelLabResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // 1. Check if lab result exists
    const labResult = await prisma.labResult.findUnique({
      where: { id }
    });

    if (!labResult) {
      return res.status(404).json({
        success: false,
        message: 'Lab result not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check if already completed
    if (labResult.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed lab result',
        error: 'ALREADY_COMPLETED'
      });
    }

    // 3. Cancel lab result
    const cancelledResult = await prisma.labResult.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : labResult.notes
      },
      select: {
        id: true,
        status: true,
        test: {
          select: {
            name: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Lab result cancelled successfully',
      data: { labResult: cancelledResult }
    });

  } catch (error) {
    console.error('❌ Cancel lab result error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel lab result',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// GET LAB RESULTS BY PATIENT
// -------------------------------------------

exports.getLabResultsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { patientId };

    const total = await prisma.labResult.count({ where });

    const labResults = await prisma.labResult.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        test: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true
          }
        },
        collectedAt: true,
        completedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: labResults.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { labResults }
    });

  } catch (error) {
    console.error('❌ Get lab results by patient error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab results',
      error: 'SERVER_ERROR'
    });
  }
};

// -------------------------------------------
// GET LAB STATISTICS
// -------------------------------------------

exports.getLabStats = async (req, res) => {
  try {
    const totalTests = await prisma.labTest.count();
    const activeTests = await prisma.labTest.count({ where: { isActive: true } });

    const totalResults = await prisma.labResult.count();

    const resultsByStatus = await prisma.labResult.groupBy({
      by: ['status'],
      _count: true
    });

    const pendingResults = await prisma.labResult.count({
      where: { status: 'PENDING' }
    });

    const completedToday = await prisma.labResult.count({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const criticalResults = await prisma.labResult.count({
      where: { status: 'CRITICAL' }
    });

    res.status(200).json({
      success: true,
      data: {
        totalTests,
        activeTests,
        inactiveTests: totalTests - activeTests,
        totalResults,
        resultsByStatus,
        pendingResults,
        completedToday,
        criticalResults
      }
    });

  } catch (error) {
    console.error('❌ Get lab stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: 'SERVER_ERROR'
    });
  }
};
