// ===========================================
// 📅 APPOINTMENT ROUTES
// ===========================================

const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  getAppointmentStats,
  getAppointmentsByDoctor,
  getAppointmentsByPatient
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ===========================================
// 🔒 ALL ROUTES PROTECTED (Authentication Required)
// ===========================================

// Apply protect middleware to all routes in this file
router.use(protect);

// ===========================================
// 📅 APPOINTMENT ENDPOINTS
// ===========================================

// GET /api/appointments - Get all appointments (with filters)
// Query params: ?page=1&limit=10&status=SCHEDULED&doctorId=xxx&patientId=xxx
router.get('/', getAllAppointments);

// GET /api/appointments/stats - Get appointment statistics (Admin only)
router.get('/stats', authorize('ADMIN'), getAppointmentStats);

// GET /api/appointments/:id - Get single appointment by ID
router.get('/:id', getAppointmentById);

// POST /api/appointments - Create new appointment (Admin, Doctor, Staff)
router.post('/', authorize('ADMIN', 'DOCTOR', 'STAFF'), createAppointment);

// PUT /api/appointments/:id - Update appointment (Admin, Doctor)
router.put('/:id', authorize('ADMIN', 'DOCTOR'), updateAppointment);

// PATCH /api/appointments/:id/cancel - Cancel appointment (Admin, Doctor, Staff)
router.patch('/:id/cancel', authorize('ADMIN', 'DOCTOR', 'STAFF'), cancelAppointment);

// PATCH /api/appointments/:id/complete - Complete appointment & create medical record (Doctor only)
router.patch('/:id/complete', authorize('DOCTOR'), completeAppointment);

// GET /api/appointments/doctor/:doctorId - Get appointments by doctor
router.get('/doctor/:doctorId', authorize('ADMIN', 'DOCTOR'), getAppointmentsByDoctor);

// GET /api/appointments/patient/:patientId - Get appointments by patient
router.get('/patient/:patientId', authorize('ADMIN', 'DOCTOR', 'STAFF'), getAppointmentsByPatient);

// ===========================================
// 📤 EXPORT ROUTER
// ===========================================

module.exports = router;
