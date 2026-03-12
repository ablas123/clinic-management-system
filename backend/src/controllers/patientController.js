// ===========================================
// 👤 PATIENT CONTROLLER
// ===========================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ===========================================
// 📋 GET ALL PATIENTS (With Pagination & Search)
// ===========================================

exports.getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search filter
    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    } : {};

    // Get total count for pagination
    const total = await prisma.patient.count({ where });

    // Get patients with pagination
    const patients = await prisma.patient.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        bloodType: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { patients }
    });

  } catch (error) {
    console.error('❌ Get all patients error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🔍 GET SINGLE PATIENT BY ID
// ===========================================

exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        bloodType: true,
        appointments: {
          select: {
            id: true,
            date: true,
            status: true,
            doctor: {
              select: {
                id: true,
                name: true,
                specialty: true
              }
            }
          }
        },
        medicalRecords: {
          select: {
            id: true,
            diagnosis: true,
            createdAt: true,
            doctor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: { patient }
    });

  } catch (error) {
    console.error('❌ Get patient by ID error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ➕ CREATE NEW PATIENT
// ===========================================

exports.createPatient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodType
    } = req.body;

    // 1. Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and phone are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      });
    }

    // 3. Check if patient already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: 'Patient with this email already exists',
        error: 'PATIENT_EXISTS'
      });
    }

    // 4. Create patient
    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        bloodType
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        bloodType: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: { patient }
    });

  } catch (error) {
    console.error('❌ Create patient error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create patient',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ✏️ UPDATE PATIENT
// ===========================================

exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodType
    } = req.body;

    // 1. Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check email uniqueness if email is being updated
    if (email && email.toLowerCase() !== existingPatient.email) {
      const emailExists = await prisma.patient.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Patient with this email already exists',
          error: 'EMAIL_EXISTS'
        });
      }
    }

    // 3. Update patient
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: email ? email.toLowerCase() : undefined,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        bloodType
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        bloodType: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: { patient }
    });

  } catch (error) {
    console.error('❌ Update patient error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🗑️ DELETE PATIENT
// ===========================================

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Delete patient (cascade will handle related records)
    await prisma.patient.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete patient error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 📊 GET PATIENT STATISTICS
// ===========================================

exports.getPatientStats = async (req, res) => {
  try {
    const totalPatients = await prisma.patient.count();
    
    const patientsByGender = await prisma.patient.groupBy({
      by: ['gender'],
      _count: true
    });

    const newPatientsThisMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(1)) // First day of current month
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        patientsByGender,
        newPatientsThisMonth
      }
    });

  } catch (error) {
    console.error('❌ Get patient stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: 'SERVER_ERROR'
    });
  }
};
