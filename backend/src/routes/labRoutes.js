// ===========================================
// 🧪 LABORATORY ROUTES
// ===========================================

const express = require('express');
const router = express.Router();
const {
  getAllLabTests,
  getLabTestById,
  createLabTest,
  updateLabTest,
  deleteLabTest,
  toggleLabTestAvailability,
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
// 🌐 PUBLIC ROUTES (No Authentication Required)
// ===========================================

// GET /api/lab/tests - Get all lab tests (PUBLIC - like a service catalog)
router.get('/tests', getAllLabTests);

// GET /api/lab/tests/:id - Get single lab test (PUBLIC)
router.get('/tests/:id', getLabTestById);

// ===========================================
// 🔒 PROTECTED ROUTES (Authentication Required)
// ===========================================

// Apply protect middleware from this point forward
router.use(protect);

// GET /api/lab/tests/stats - Get lab statistics (Admin only)
router.get('/tests/stats', authorize('ADMIN'), getLabStats);

// POST /api/lab/tests - Create new lab test (Admin only)
router.post('/tests', authorize('ADMIN'), createLabTest);

// PUT /api/lab/tests/:id - Update lab test (Admin only)
router.put('/tests/:id', authorize('ADMIN'), updateLabTest);

// DELETE /api/lab/tests/:id - Delete lab test (Admin only)
router.delete('/tests/:id', authorize('ADMIN'), deleteLabTest);

// PATCH /api/lab/tests/:id/availability - Toggle availability (Admin only)
router.patch('/tests/:id/availability', authorize('ADMIN'), toggleLabTestAvailability);

// 📊 LAB RESULTS (All require authentication)
router.get('/results', authorize('ADMIN', 'DOCTOR', 'LAB_TECH'), getAllLabResults);
router.get('/results/:id', authorize('ADMIN', 'DOCTOR', 'LAB_TECH'), getLabResultById);
router.post('/results', authorize('ADMIN', 'DOCTOR'), createLabResult);
router.patch('/results/:id/status', authorize('ADMIN', 'LAB_TECH'), updateLabResultStatus);
router.patch('/results/:id/complete', authorize('ADMIN', 'LAB_TECH', 'DOCTOR'), completeLabResult);
router.patch('/results/:id/cancel', authorize('ADMIN', 'DOCTOR'), cancelLabResult);
router.get('/results/patient/:patientId', authorize('ADMIN', 'DOCTOR', 'LAB_TECH'), getLabResultsByPatient);

module.exports = router;
