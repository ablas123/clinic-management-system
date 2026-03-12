// ===========================================
// 👨‍⚕️ DOCTOR CONTROLLER
// ===========================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ===========================================
// 📋 GET ALL DOCTORS (With Filters)
// ===========================================

exports.getAllDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const specialty = req.query.specialty || '';
    const available = req.query.available;
    const skip = (page - 1) * limit;

    // Build filters
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (specialty) {
      where.specialty = { contains: specialty, mode: 'insensitive' };
    }

    if (available !== undefined) {
      where.isAvailable = available === 'true';
    }

    // Get total count for pagination
    const total = await prisma.doctor.count({ where });

    // Get doctors with pagination
    const doctors = await prisma.doctor.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        bio: true,
        avatar: true,
        isAvailable: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: doctors.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { doctors }
    });

  } catch (error) {
    console.error('❌ Get all doctors error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🔍 GET SINGLE DOCTOR BY ID
// ===========================================

exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        bio: true,
        avatar: true,
        isAvailable: true,
        appointments: {
          select: {
            id: true,
            date: true,
            status: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 10
        },
        medicalRecords: {
          select: {
            id: true,
            diagnosis: true,
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

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: { doctor }
    });

  } catch (error) {
    console.error('❌ Get doctor by ID error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ➕ CREATE NEW DOCTOR
// ===========================================

exports.createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialty,
      bio,
      avatar,
      isAvailable
    } = req.body;

    // 1. Validate required fields
    if (!name || !email || !specialty) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and specialty are required',
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

    // 3. Check if doctor already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: 'Doctor with this email already exists',
        error: 'DOCTOR_EXISTS'
      });
    }

    // 4. Create doctor
    const doctor = await prisma.doctor.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        specialty,
        bio,
        avatar,
        isAvailable: isAvailable !== undefined ? isAvailable : true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        bio: true,
        isAvailable: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: { doctor }
    });

  } catch (error) {
    console.error('❌ Create doctor error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create doctor',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ✏️ UPDATE DOCTOR
// ===========================================

exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      specialty,
      bio,
      avatar,
      isAvailable
    } = req.body;

    // 1. Check if doctor exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check email uniqueness if email is being updated
    if (email && email.toLowerCase() !== existingDoctor.email) {
      const emailExists = await prisma.doctor.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Doctor with this email already exists',
          error: 'EMAIL_EXISTS'
        });
      }
    }

    // 3. Update doctor
    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        name,
        email: email ? email.toLowerCase() : undefined,
        phone,
        specialty,
        bio,
        avatar,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        bio: true,
        isAvailable: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: { doctor }
    });

  } catch (error) {
    console.error('❌ Update doctor error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🗑️ DELETE DOCTOR
// ===========================================

exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if doctor exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Delete doctor (cascade will handle related records)
    await prisma.doctor.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete doctor error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 📊 GET DOCTOR STATISTICS
// ===========================================

exports.getDoctorStats = async (req, res) => {
  try {
    const totalDoctors = await prisma.doctor.count();
    
    const availableDoctors = await prisma.doctor.count({
      where: { isAvailable: true }
    });

    const doctorsBySpecialty = await prisma.doctor.groupBy({
      by: ['specialty'],
      _count: true
    });

    res.status(200).json({
      success: true,
      data: {
        totalDoctors,
        availableDoctors,
        unavailableDoctors: totalDoctors - availableDoctors,
        doctorsBySpecialty
      }
    });

  } catch (error) {
    console.error('❌ Get doctor stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🔄 TOGGLE DOCTOR AVAILABILITY
// ===========================================

exports.toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Toggle availability
    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: { isAvailable: !doctor.isAvailable },
      select: {
        id: true,
        name: true,
        isAvailable: true
      }
    });

    res.status(200).json({
      success: true,
      message: `Doctor is now ${updatedDoctor.isAvailable ? 'available' : 'unavailable'}`,
      data: { doctor: updatedDoctor }
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
