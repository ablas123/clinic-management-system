// ===========================================
// 🧪 LABORATORY ROUTES
// ===========================================

const express = require('express');
const router = express.Router();
const {
  // Lab Test Types
  getAllLabTests,
  getLabTestById,
  createLabTest,
  updateLabTest,
  deleteLabTest,
  toggleLabTestAvailability,
  // Lab Results
  getAllLabResults,
  getLabResultById,
  createLabResult,
  updateLabResultStatus,
  completeLabResult,
  cancelLabResult,
  getLabResultsByPatient,
  getLabStats
} = require('../controllers/labController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ===========================================
// 🔒 ALL ROUTES PROTECTED (Authentication Required)
// ===========================================

// Apply protect middleware to all routes in this file
router.use(protect);

// ===========================================
// 🧪 LAB TEST TYPES ENDPOINTS
// ===========================================

// GET /api/lab/tests - Get all lab tests (with filters)
// Query params: ?page=1&limit=10&search=CBC&category=Blood&isActive=true
router.get('/tests', getAllLabTests);

// GET /api/lab/tests/stats - Get lab statistics (Admin only)
router.get('/tests/stats', authorize('ADMIN'), getLabStats);

// GET /api/lab/tests/:id - Get single lab test by ID
router.get('/tests/:id', getLabTestById);

// POST /api/lab/tests - Create new lab test (Admin only)
router.post('/tests', authorize('ADMIN'), createLabTest);

// PUT /api/lab/tests/:id - Update lab test (Admin only)
router.put('/tests/:id', authorize('ADMIN'), updateLabTest);

// DELETE /api/lab/tests/:id - Delete lab test (Admin only)
router.delete('/tests/:id', authorize('ADMIN'), deleteLabTest);

// PATCH /api/lab/tests/:id/availability - Toggle lab test availability (Admin only)
router.patch('/tests/:id/availability', authorize('ADMIN'), toggleLabTestAvailability);

// ===========================================
// 📊 LAB RESULTS ENDPOINTS
// ===========================================

// GET /api/lab/results - Get all lab results (with filters)
// Query params: ?page=1&limit=10&status=PENDING&patientId=xxx&testId=xxx
router.get('/results', authorize('ADMIN', 'DOCTOR', 'LAB_TECH'), getAllLabResults);

// GET /api/lab/results/:id - Get single lab result by ID
router.get('/results/:id', authorize('ADMIN', 'DOCTOR', 'LAB_TECH'), getLabResultById);

// POST /api/lab/results - Order a new lab test (Admin, Doctor)
router.post('/results', authorize('ADMIN', 'DOCTOR'), createLabResult);

// PATCH /api/lab/results/:id/status - Update lab result status (Admin, LAB_TECH)
router.patch('/results/:id/status', authorize('ADMIN', 'LAB_TECH'), updateLabResultStatus);

// PATCH /api/lab/results/:id/complete - Complete lab result with findings (LAB_TECH, Doctor)
router.patch('/results/:id/complete', authorize('ADMIN', 'LAB_TECH', 'DOCTOR'), completeLabResult);

// PATCH /api/lab/results/:id/cancel - Cancel lab result (Admin, Doctor)
router.patch('/results/:id/cancel', authorize('ADMIN', 'DOCTOR'), cancelLabResult);

// GET /api/lab/results/patient/:patientId - Get lab results by patient
router.get('/results/patient/:patientId', authorize('ADMIN', 'DOCTOR', 'LAB_TECH'), getLabResultsByPatient);

// ===========================================
// 📤 EXPORT ROUTER
// ===========================================

module.exports = router;
