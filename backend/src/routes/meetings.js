const express = require('express');
const router = express.Router();
const { auth, isAdmin, isAuthorizedLive, isAuthorized } = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');
const joinRequestController = require('../controllers/joinRequestController');
const agendaController = require('../controllers/assemblyAgendaController');
const rolesController = require('../controllers/assemblyRolesController');
const powersController = require('../controllers/assemblyPowersController');

// Todos los usuarios autenticados pueden ver reuniones
router.get('/', auth, meetingController.getAllMeetings);
router.get('/public/:id', meetingController.getPublicMeeting);
router.get('/:id', auth, meetingController.getMeeting);
router.get('/:id/quorum', auth, meetingController.getQuorum);
router.get('/:id/quorum-detail', auth, meetingController.getQuorumDetail);
router.get('/:id/validate-installation', auth, meetingController.validateInstallation);

// M1 — Quórum de Asamblea (panel por cursos representados)
router.get('/:id/assembly-quorum', auth, meetingController.getAssemblyQuorum);
router.get('/:id/assembly-courses', auth, meetingController.getAssemblyCourses);
router.post('/:id/assembly-quorum/refresh', auth, isAuthorizedLive, meetingController.refreshAssemblyQuorum);

// M6 — Orden del Día
router.get('/:id/agenda', auth, isAuthorized, agendaController.getAgenda);
router.post('/:id/agenda', auth, isAuthorized, agendaController.createAgenda);
router.post('/:id/agenda/load-template', auth, isAdmin, agendaController.loadTemplate);
router.post('/:id/agenda/publish', auth, isAuthorized, agendaController.publishAgenda);
router.post('/:id/agenda/items', auth, isAuthorized, agendaController.addItem);
router.put('/:id/agenda/items/:itemId', auth, isAdmin, agendaController.updateItem);
router.delete('/:id/agenda/items/:itemId', auth, isAdmin, agendaController.removeItem);
router.post('/:id/agenda/items/:itemId/start', auth, isAuthorized, agendaController.startItem);
router.post('/:id/agenda/items/:itemId/complete', auth, isAuthorized, agendaController.completeItem);
router.post('/:id/agenda/items/:itemId/skip', auth, isAdmin, agendaController.skipItem);
router.post('/:id/agenda/items/:itemId/link-vote', auth, isAuthorized, agendaController.linkVote);
router.post('/:id/agenda/items/:itemId/link-election', auth, isAuthorized, agendaController.linkElection);

// M7 — Roles de Asamblea (acta antes de :roleType para evitar colisión de rutas)
router.get('/:id/roles/acta', auth, isAdmin, rolesController.getRolesForActa);
router.get('/:id/roles', auth, isAuthorized, rolesController.getRoles);
router.post('/:id/roles', auth, isAuthorized, rolesController.assignRole);
router.get('/:id/roles/:roleType', auth, isAuthorized, rolesController.getRoleByType);
router.delete('/:id/roles/:sessionRoleId', auth, isAuthorized, rolesController.revokeRole);

// M3 — Poderes / Transferencia de Representación (sin DELETE: revocación pendiente VF-06)
router.get('/:id/powers/apoderado/:memberId', auth, isAuthorized, powersController.getApoderadoLoad);
router.get('/:id/powers', auth, isAuthorized, powersController.getPowers);
router.post('/:id/powers', auth, isAuthorized, powersController.registerPower);

// Solo admin puede crear/editar/eliminar reuniones (antes del evento)
router.post('/', auth, isAdmin, meetingController.createMeeting);
router.put('/:id', auth, isAdmin, meetingController.updateMeeting);
router.delete('/:id', auth, isAdmin, meetingController.deleteMeeting);

// Cambio de estado (admin o autorizado en vivo)
router.patch('/:id/status', auth, isAuthorizedLive, meetingController.updateMeetingStatus);

// Solo Autorizado (y admin_master) instala sesión en vivo
router.post('/:id/install-session', auth, isAuthorizedLive, meetingController.installSession);
// Designar representante JV para la reunión (admin/authorized)
router.post('/:id/jv-representative', auth, isAuthorizedLive, meetingController.setJvRepresentative);
router.get('/:id/jv-representative', auth, meetingController.getJvRepresentative);

// Rutas de solicitudes de unión
router.post('/:meetingId/join-request', auth, joinRequestController.requestToJoin);
router.get('/:meetingId/join-requests', auth, joinRequestController.getPendingRequests);
router.post('/:meetingId/join-requests/:requestId/accept', auth, joinRequestController.acceptRequest);
router.post('/:meetingId/join-requests/:requestId/reject', auth, joinRequestController.rejectRequest);
router.get('/:meetingId/join-request/status', auth, joinRequestController.getUserRequestStatus);

module.exports = router;

