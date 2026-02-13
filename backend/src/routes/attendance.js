const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// Rutas autenticadas
router.get('/meeting/:meetingId', auth, attendanceController.getAttendance);
router.post('/meeting/:meetingId', auth, attendanceController.registerAttendance);
router.put('/:id', auth, attendanceController.updateAttendance);

// Nuevas rutas públicas seguras (sistema de verificación por cédula)
router.post('/verify/meeting/:meetingId', attendanceController.verifyDocument);
router.post('/confirm/meeting/:meetingId', attendanceController.confirmAttendance);
router.post('/manual/meeting/:meetingId', attendanceController.registerManualAttendance);

// Ruta legacy (mantener para compatibilidad, pero deprecar)
router.post('/public/meeting/:meetingId', attendanceController.registerPublicAttendance);

module.exports = router;

