const express = require('express');
const router = express.Router();
const { auth, isAdmin, isAdminOrAuthorized } = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');
const joinRequestController = require('../controllers/joinRequestController');

// Todos los usuarios autenticados pueden ver reuniones
router.get('/', auth, meetingController.getAllMeetings);
router.get('/public/:id', meetingController.getPublicMeeting);
router.get('/:id', auth, meetingController.getMeeting);
router.get('/:id/quorum', auth, meetingController.getQuorum);
router.get('/:id/validate-installation', auth, meetingController.validateInstallation);

// Solo admin puede crear/editar/eliminar reuniones (antes del evento)
router.post('/', auth, isAdmin, meetingController.createMeeting);
router.put('/:id', auth, isAdmin, meetingController.updateMeeting);
router.delete('/:id', auth, isAdmin, meetingController.deleteMeeting);

// Admin y Authorized pueden instalar sesión (durante la reunión)
router.post('/:id/install-session', auth, isAdminOrAuthorized, meetingController.installSession);

// Rutas de solicitudes de unión
router.post('/:meetingId/join-request', auth, joinRequestController.requestToJoin);
router.get('/:meetingId/join-requests', auth, joinRequestController.getPendingRequests);
router.post('/:meetingId/join-requests/:requestId/accept', auth, joinRequestController.acceptRequest);
router.post('/:meetingId/join-requests/:requestId/reject', auth, joinRequestController.rejectRequest);
router.get('/:meetingId/join-request/status', auth, joinRequestController.getUserRequestStatus);

module.exports = router;

