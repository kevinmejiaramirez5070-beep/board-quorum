const express = require('express');
const router = express.Router();
const { auth, isAdmin, isAdminOrAuthorized, isAuthorizedLive } = require('../middleware/auth');
const votingController = require('../controllers/votingController');

// Admin y Authorized pueden ver votaciones y resultados
router.get('/meeting/:meetingId', auth, isAdminOrAuthorized, votingController.getVotings);
router.get('/:id', auth, isAdminOrAuthorized, votingController.getVoting);
router.get('/:id/results', auth, isAdminOrAuthorized, votingController.getResults);

// Solo admin puede crear votaciones (antes del evento)
router.post('/meeting/:meetingId', auth, isAdmin, votingController.createVoting);
router.put('/:id', auth, isAdmin, votingController.updateVoting);

// Solo Autorizado (y admin_master) activa y cierra votaciones en vivo
router.put('/:id/activate', auth, isAuthorizedLive, votingController.activateVoting);
router.put('/:id/close', auth, isAuthorizedLive, votingController.closeVoting);

// Endpoints públicos (sin autenticación) — específico antes que genérico
router.get('/public/meeting/:meetingId/active', votingController.getActiveMeetingVoting);
router.get('/public/:id', votingController.getPublicVoting);

module.exports = router;

