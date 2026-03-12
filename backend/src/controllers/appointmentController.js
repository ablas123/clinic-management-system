// ===========================================
// 📅 APPOINTMENT CONTROLLER
// ===========================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ===========================================
// 📋 GET ALL APPOINTMENTS (With Filters)
// ===========================================

exports.getAllAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const doctorId = req.query.doctorId || '';
    const patientId = req.query.patientId || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const skip = (page - 1) * limit;

    // Build filters
    const where = {};

    if (status) {
      where.status = status;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) {
        where.date.gte = new Date(fromDate);
      }
      if (toDate) {
        where.date.lte = new Date(toDate);
      }
    }

    // Get total count for pagination
    const total = await prisma.appointment.count({ where });

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        date: true,
        status: true,
        reason: true,
        notes: true,
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            email: true
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        createdAt: true
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { appointments }
    });

  } catch (error) {
    console.error('❌ Get all appointments error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🔍 GET SINGLE APPOINTMENT BY ID
// ===========================================

exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        date: true,
        status: true,
        reason: true,
        notes: true,
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            email: true,
            phone: true
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            bloodType: true
          }
        },
        medicalRecord: {
          select: {
            id: true,
            diagnosis: true,
            prescription: true,
            notes: true,
            createdAt: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: { appointment }
    });

  } catch (error) {
    console.error('❌ Get appointment by ID error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ➕ CREATE NEW APPOINTMENT
// ===========================================

exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, date, reason, notes } = req.body;

    // 1. Validate required fields
    if (!doctorId || !patientId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, patient ID, and date are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // 2. Validate date is in the future
    const appointmentDate = new Date(date);
    const now = new Date();
    if (appointmentDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future',
        error: 'INVALID_DATE'
      });
    }

    // 3. Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        error: 'DOCTOR_NOT_FOUND'
      });
    }

    // 4. Check if doctor is available
    if (!doctor.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is currently not available',
        error: 'DOCTOR_UNAVAILABLE'
      });
    }

    // 5. Check if patient exists
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

    // 6. Check for time conflict (same doctor, same time)
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: appointmentDate,
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'Doctor already has an appointment at this time',
        error: 'TIME_CONFLICT'
      });
    }

    // 7. Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        date: appointmentDate,
        reason,
        notes,
        status: 'SCHEDULED'
      },
      select: {
        id: true,
        date: true,
        status: true,
        reason: true,
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('❌ Create appointment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ✏️ UPDATE APPOINTMENT
// ===========================================

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status, reason, notes } = req.body;

    // 1. Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Validate status if provided
    const validStatuses = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        error: 'INVALID_STATUS'
      });
    }

    // 3. Validate date if provided
    if (date) {
      const appointmentDate = new Date(date);
      const now = new Date();
      if (appointmentDate <= now && existingAppointment.date > now) {
        return res.status(400).json({
          success: false,
          message: 'New appointment date must be in the future',
          error: 'INVALID_DATE'
        });
      }
    }

    // 4. Update appointment
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        status,
        reason,
        notes
      },
      select: {
        id: true,
        date: true,
        status: true,
        reason: true,
        notes: true,
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('❌ Update appointment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🗑️ CANCEL APPOINTMENT
// ===========================================

exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check if already cancelled
    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled',
        error: 'ALREADY_CANCELLED'
      });
    }

    // 3. Cancel appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      select: {
        id: true,
        status: true,
        date: true,
        doctor: {
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
      message: 'Appointment cancelled successfully',
      data: { appointment: updatedAppointment }
    });

  } catch (error) {
    console.error('❌ Cancel appointment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ✅ COMPLETE APPOINTMENT
// ===========================================

exports.completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, prescription, notes } = req.body;

    // 1. Check if appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check if already completed
    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already completed',
        error: 'ALREADY_COMPLETED'
      });
    }

    // 3. Update appointment status and create medical record
    const [updatedAppointment, medicalRecord] = await prisma.$transaction([
      prisma.appointment.update({
        where: { id },
        data: { status: 'COMPLETED' }
      }),
      prisma.medicalRecord.create({
        data: {
          appointmentId: id,
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
          diagnosis,
          prescription,
          notes
        }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Appointment completed and medical record created',
      data: {
        appointment: updatedAppointment,
        medicalRecord
      }
    });

  } catch (error) {
    console.error('❌ Complete appointment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to complete appointment',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 📊 GET APPOINTMENT STATISTICS
// ===========================================

exports.getAppointmentStats = async (req, res) => {
  try {
    const totalAppointments = await prisma.appointment.count();

    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      _count: true
    });

    const todayAppointments = await prisma.appointment.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    });

    const upcomingAppointments = await prisma.appointment.count({
      where: {
        date: {
          gt: new Date()
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        appointmentsByStatus,
        todayAppointments,
        upcomingAppointments
      }
    });

  } catch (error) {
    console.error('❌ Get appointment stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 📅 GET APPOINTMENTS BY DOCTOR
// ===========================================

exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { doctorId };

    const total = await prisma.appointment.count({ where });

    const appointments = await prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        date: true,
        status: true,
        reason: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        createdAt: true
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { appointments }
    });

  } catch (error) {
    console.error('❌ Get appointments by doctor error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 📅 GET APPOINTMENTS BY PATIENT
// ===========================================

exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { patientId };

    const total = await prisma.appointment.count({ where });

    const appointments = await prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        date: true,
        status: true,
        reason: true,
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        },
        createdAt: true
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { appointments }
    });

  } catch (error) {
    console.error('❌ Get appointments by patient error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: 'SERVER_ERROR'
    });
  }
};
