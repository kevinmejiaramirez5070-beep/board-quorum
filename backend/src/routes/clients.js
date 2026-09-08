const express = require('express');
const router = express.Router();
const { auth, isAdminMaster } = require('../middleware/auth');
const clientController = require('../controllers/clientController');

// Endpoint público para login (sin autenticación)
router.get('/public', clientController.getPublic);
// Endpoint protegido para administración
router.get('/', auth, clientController.getAll);
router.get('/stats/platform', auth, isAdminMaster, clientController.getPlatformStats);
router.get('/meetings/active', auth, isAdminMaster, clientController.getActiveMeetings);
router.get('/:id', clientController.getById);
// Crear organizaciones es exclusivo del Admin Master (onboarding global)
router.post('/', auth, isAdminMaster, clientController.create);
router.put('/:id', auth, clientController.update);
router.patch('/:id/active', auth, clientController.setActive);
router.delete('/:id', auth, clientController.delete);

module.exports = router;
