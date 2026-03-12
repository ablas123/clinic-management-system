// ===========================================
// 👤 PATIENT ROUTES
// ===========================================

const express = require('express');
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientStats
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ===========================================
// 🔒 ALL ROUTES PROTECTED (Authentication Required)
// ===========================================

// Apply protect middleware to all routes in this file
router.use(protect);

// ===========================================
// 📋 PATIENT ENDPOINTS
// ===========================================

// GET /api/patients - Get all patients (with pagination & search)
// Query params: ?page=1&limit=10&search=ahmed
router.get('/', getAllPatients);

// GET /api/patients/stats - Get patient statistics (Admin only)
router.get('/stats', authorize('ADMIN'), getPatientStats);

// GET /api/patients/:id - Get single patient by ID
router.get('/:id', getPatientById);

// POST /api/patients - Create new patient (Admin & Staff only)
router.post('/', authorize('ADMIN', 'STAFF'), createPatient);

// PUT /api/patients/:id - Update patient (Admin & Staff only)
router.put('/:id', authorize('ADMIN', 'STAFF'), updatePatient);

// DELETE /api/patients/:id - Delete patient (Admin only)
router.delete('/:id', authorize('ADMIN'), deletePatient);

// ===========================================
// 📤 EXPORT ROUTER
// ===========================================

module.exports = router;
