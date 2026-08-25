const express = require('express');
const router = express.Router();
const { auth, isAdmin, isAssemblyOperator } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// Rutas autenticadas
router.get('/meeting/:meetingId', auth, attendanceController.getAttendance);
router.post('/meeting/:meetingId', auth, attendanceController.registerAttendance);
router.post('/meeting/:meetingId/bulk', auth, attendanceController.registerBulkAttendance);
router.put('/:id', auth, attendanceController.updateAttendance);

// Nuevas rutas públicas seguras (sistema de verificación por cédula)
router.post('/verify/meeting/:meetingId', attendanceController.verifyDocument);
router.post('/confirm/meeting/:meetingId', attendanceController.confirmAttendance);
router.post('/manual/meeting/:meetingId', attendanceController.registerManualAttendance);

// Ruta legacy (mantener para compatibilidad, pero deprecar)
router.post('/public/meeting/:meetingId', attendanceController.registerPublicAttendance);

// MD-09 — Solicitudes de validacion pendientes (contingencia de Delegado no encontrado)
router.get('/meeting/:meetingId/pending', auth, isAssemblyOperator, attendanceController.listPendingContingencies);

// Admin valida / rechaza asistencia pendiente.
// En Asamblea la decision la puede tomar cualquiera de los cuatro usuarios
// operativos (MD-03); en Junta Directiva sigue siendo cosa de admin.
router.patch('/:id/approve', auth, isAssemblyOperator, attendanceController.approvePendingAttendance);
router.patch('/:id/reject', auth, isAssemblyOperator, attendanceController.rejectPendingAttendance);

module.exports = router;

