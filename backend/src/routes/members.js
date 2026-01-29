const express = require('express');
const router = express.Router();
const { auth, isAdmin, isAuthorized } = require('../middleware/auth');
const memberController = require('../controllers/memberController');

// Solo admin puede gestionar miembros (authorized NO puede editar)
// Authorized puede ver miembros para generar enlaces, pero no editarlos
router.get('/', auth, isAuthorized, memberController.getAllMembers);
router.get('/:id', auth, isAuthorized, memberController.getMember);
// Solo admin puede crear/editar/eliminar miembros
router.post('/', auth, isAdmin, memberController.createMember);
router.put('/:id', auth, isAdmin, memberController.updateMember);
router.delete('/:id', auth, isAdmin, memberController.deleteMember);

// Endpoint público para obtener miembros de una reunión (sin autenticación)
router.get('/public/meeting/:meetingId', memberController.getPublicMembersByMeeting);

module.exports = router;

