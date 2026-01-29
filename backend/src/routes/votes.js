const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const voteController = require('../controllers/voteController');

router.post('/', auth, voteController.castVote);
router.get('/voting/:votingId', auth, voteController.getVotes);

// Endpoint público (sin autenticación)
router.post('/public/:votingId', voteController.castPublicVote);

module.exports = router;

