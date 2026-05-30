const express = require('express');
const router = express.Router();
const { auth, isAdminMaster } = require('../middleware/auth');
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile', auth, authController.getProfile);
router.put('/change-password', auth, authController.changePassword);
router.put('/change-email', auth, authController.changeEmail);
router.post('/validate-member', auth, authController.validateMember);

// Gestión de usuarios (admin_master)
router.get('/users', auth, isAdminMaster, authController.getUsersByClient);
router.patch('/users/:id', auth, isAdminMaster, authController.updateUserCredentials);

module.exports = router;

