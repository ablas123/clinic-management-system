// ===========================================
// 💰 INVOICE ROUTES
// ===========================================

const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid,
  cancelInvoice,
  getInvoiceStats,
  getInvoicesByPatient,
  getOverdueInvoices
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ===========================================
// 🔒 ALL ROUTES PROTECTED (Authentication Required)
// ===========================================

// Apply protect middleware to all routes in this file
router.use(protect);

// ===========================================
// 💰 INVOICE ENDPOINTS
// ===========================================

// GET /api/invoices - Get all invoices (with filters)
// Query params: ?page=1&limit=10&status=PENDING&patientId=xxx
router.get('/', getAllInvoices);

// GET /api/invoices/stats - Get invoice statistics (Admin only)
router.get('/stats', authorize('ADMIN'), getInvoiceStats);

// GET /api/invoices/overdue - Get overdue invoices (Admin, Staff)
router.get('/overdue', authorize('ADMIN', 'STAFF'), getOverdueInvoices);

// GET /api/invoices/:id - Get single invoice by ID
router.get('/:id', getInvoiceById);

// POST /api/invoices - Create new invoice (Admin, Staff)
router.post('/', authorize('ADMIN', 'STAFF'), createInvoice);

// PUT /api/invoices/:id - Update invoice (Admin, Staff)
router.put('/:id', authorize('ADMIN', 'STAFF'), updateInvoice);

// DELETE /api/invoices/:id - Delete invoice (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteInvoice);

// PATCH /api/invoices/:id/pay - Mark invoice as paid (Admin, Staff)
router.patch('/:id/pay', authorize('ADMIN', 'STAFF'), markAsPaid);

// PATCH /api/invoices/:id/cancel - Cancel invoice (Admin only)
router.patch('/:id/cancel', authorize('ADMIN'), cancelInvoice);

// GET /api/invoices/patient/:patientId - Get invoices by patient
router.get('/patient/:patientId', authorize('ADMIN', 'DOCTOR', 'STAFF'), getInvoicesByPatient);

// ===========================================
// 📤 EXPORT ROUTER
// ===========================================

module.exports = router;
