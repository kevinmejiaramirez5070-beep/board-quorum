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

// Solo Autorizado (y admin_master) activa votaciones en vivo
router.put('/:id/activate', auth, isAuthorizedLive, votingController.activateVoting);

// Endpoint público (sin autenticación)
router.get('/public/:id', votingController.getPublicVoting);

module.exports = router;

