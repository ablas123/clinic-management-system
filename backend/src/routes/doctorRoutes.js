// ===========================================
// 👨‍⚕️ DOCTOR ROUTES
// ===========================================

const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorStats,
  toggleAvailability
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ===========================================
// 🔒 ALL ROUTES PROTECTED (Authentication Required)
// ===========================================

// Apply protect middleware to all routes in this file
router.use(protect);

// ===========================================
// 👨‍⚕️ DOCTOR ENDPOINTS
// ===========================================

// GET /api/doctors - Get all doctors (with filters)
// Query params: ?page=1&limit=10&search=ahmed&specialty=cardiology&available=true
router.get('/', getAllDoctors);

// GET /api/doctors/stats - Get doctor statistics (Admin only)
router.get('/stats', authorize('ADMIN'), getDoctorStats);

// GET /api/doctors/:id - Get single doctor by ID
router.get('/:id', getDoctorById);

// POST /api/doctors - Create new doctor (Admin only)
router.post('/', authorize('ADMIN'), createDoctor);

// PUT /api/doctors/:id - Update doctor (Admin only)
router.put('/:id', authorize('ADMIN'), updateDoctor);

// DELETE /api/doctors/:id - Delete doctor (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteDoctor);

// PATCH /api/doctors/:id/availability - Toggle doctor availability (Admin only)
router.patch('/:id/availability', authorize('ADMIN'), toggleAvailability);

// ===========================================
// 📤 EXPORT ROUTER
// ===========================================

module.exports = router;
