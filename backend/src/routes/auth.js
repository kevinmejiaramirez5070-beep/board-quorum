const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile', auth, authController.getProfile);
router.put('/change-password', auth, authController.changePassword);
router.put('/change-email', auth, authController.changeEmail);
router.post('/validate-member', auth, authController.validateMember);

module.exports = router;

