// ===========================================
// 💰 INVOICE CONTROLLER
// ===========================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ===========================================
// 📋 GET ALL INVOICES (With Filters)
// ===========================================

exports.getAllInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const patientId = req.query.patientId || '';
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
    const total = await prisma.invoice.count({ where });

    // Get invoices with pagination
    const invoices = await prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        description: true,
        status: true,
        dueDate: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        appointment: {
          select: {
            id: true,
            date: true,
            doctor: {
              select: {
                id: true,
                name: true,
                specialty: true
              }
            }
          }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { invoices }
    });

  } catch (error) {
    console.error('❌ Get all invoices error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🔍 GET SINGLE INVOICE BY ID
// ===========================================

exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        description: true,
        status: true,
        dueDate: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true
          }
        },
        appointment: {
          select: {
            id: true,
            date: true,
            doctor: {
              select: {
                id: true,
                name: true,
                specialty: true
              }
            }
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: { invoice }
    });

  } catch (error) {
    console.error('❌ Get invoice by ID error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ➕ CREATE NEW INVOICE
// ===========================================

exports.createInvoice = async (req, res) => {
  try {
    const { patientId, appointmentId, amount, description, dueDate } = req.body;

    // 1. Validate required fields
    if (!patientId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and amount are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // 2. Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
        error: 'INVALID_AMOUNT'
      });
    }

    // 3. Check if patient exists
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

    // 4. Check if appointment exists (if provided)
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

      // Check if appointment already has an invoice
      const existingInvoice = await prisma.invoice.findFirst({
        where: { appointmentId }
      });

      if (existingInvoice) {
        return res.status(409).json({
          success: false,
          message: 'Invoice already exists for this appointment',
          error: 'INVOICE_EXISTS'
        });
      }
    }

    // 5. Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        patientId,
        appointmentId,
        amount,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'PENDING'
      },
      select: {
        id: true,
        amount: true,
        description: true,
        status: true,
        dueDate: true,
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
      message: 'Invoice created successfully',
      data: { invoice }
    });

  } catch (error) {
    console.error('❌ Create invoice error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ✏️ UPDATE INVOICE
// ===========================================

exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, dueDate, status } = req.body;

    // 1. Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Validate status if provided
    const validStatuses = ['PENDING', 'PAID', 'CANCELLED', 'OVERDUE'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        error: 'INVALID_STATUS'
      });
    }

    // 3. Validate amount if provided
    if (amount && amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
        error: 'INVALID_AMOUNT'
      });
    }

    // 4. Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        amount: amount !== undefined ? amount : undefined,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status
      },
      select: {
        id: true,
        amount: true,
        description: true,
        status: true,
        dueDate: true,
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
      message: 'Invoice updated successfully',
      data: { invoice }
    });

  } catch (error) {
    console.error('❌ Update invoice error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🗑️ DELETE INVOICE
// ===========================================

exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check if invoice is already paid
    if (existingInvoice.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a paid invoice',
        error: 'PAID_INVOICE'
      });
    }

    // 3. Delete invoice
    await prisma.invoice.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete invoice error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ✅ MARK INVOICE AS PAID
// ===========================================

exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check if already paid
    if (invoice.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid',
        error: 'ALREADY_PAID'
      });
    }

    // 3. Mark as paid
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'PAID' },
      select: {
        id: true,
        amount: true,
        status: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Invoice marked as paid successfully',
      data: { invoice: updatedInvoice }
    });

  } catch (error) {
    console.error('❌ Mark as paid error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to mark invoice as paid',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ❌ CANCEL INVOICE
// ===========================================

exports.cancelInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        error: 'NOT_FOUND'
      });
    }

    // 2. Check if already paid
    if (invoice.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a paid invoice',
        error: 'PAID_INVOICE'
      });
    }

    // 3. Cancel invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
      select: {
        id: true,
        status: true,
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Invoice cancelled successfully',
      data: { invoice: updatedInvoice }
    });

  } catch (error) {
    console.error('❌ Cancel invoice error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel invoice',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 📊 GET INVOICE STATISTICS
// ===========================================

exports.getInvoiceStats = async (req, res) => {
  try {
    const totalInvoices = await prisma.invoice.count();

    const invoicesByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      _count: true
    });

    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    });

    const pendingAmount = await prisma.invoice.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true }
    });

    const thisMonthRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: new Date(new Date().setDate(1))
        }
      },
      _sum: { amount: true }
    });

    res.status(200).json({
      success: true,
      data: {
        totalInvoices,
        invoicesByStatus,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
        thisMonthRevenue: thisMonthRevenue._sum.amount || 0
      }
    });

  } catch (error) {
    console.error('❌ Get invoice stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 📅 GET INVOICES BY PATIENT
// ===========================================

exports.getInvoicesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { patientId };

    const total = await prisma.invoice.count({ where });

    const invoices = await prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        description: true,
        status: true,
        dueDate: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { invoices }
    });

  } catch (error) {
    console.error('❌ Get invoices by patient error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ⚠️ GET OVERDUE INVOICES
// ===========================================

exports.getOverdueInvoices = async (req, res) => {
  try {
    const now = new Date();

    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: now
        }
      },
      select: {
        id: true,
        amount: true,
        description: true,
        dueDate: true,
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
      orderBy: { dueDate: 'asc' }
    });

    // Update status to OVERDUE
    await prisma.invoice.updateMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: now
        }
      },
      data: { status: 'OVERDUE' }
    });

    res.status(200).json({
      success: true,
      count: overdueInvoices.length,
      data: { invoices: overdueInvoices }
    });

  } catch (error) {
    console.error('❌ Get overdue invoices error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue invoices',
      error: 'SERVER_ERROR'
    });
  }
};
