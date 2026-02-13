const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const voteController = require('../controllers/voteController');

// Rutas autenticadas
router.post('/', auth, voteController.castVote);
router.get('/voting/:votingId', auth, voteController.getVotes);

// Nuevas rutas públicas seguras (sistema de verificación por cédula)
router.post('/verify/:votingId', voteController.verifyDocumentForVoting);
router.post('/confirm/:votingId', voteController.confirmVote);

// Ruta legacy (mantener para compatibilidad, pero deprecar)
router.post('/public/:votingId', voteController.castPublicVote);

module.exports = router;

