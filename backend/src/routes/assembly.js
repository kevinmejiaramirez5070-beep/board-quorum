const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, isAdmin, isAuthorized } = require('../middleware/auth');
const assemblyController = require('../controllers/assemblyController');

// Archivo XLSX en memoria (máx 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ── Módulo 2 — Carga y Validación de Delegados ──────────────────────────────

// Cargar maestro (XLSX). VF-02 default: solo admin / admin_master.
router.post('/:productId/members/import', auth, isAdmin, upload.single('file'), assemblyController.importMembers);

// Consultas (authorized / admin / admin_master)
router.get('/:productId/members', auth, isAuthorized, assemblyController.listMembers);
router.get('/:productId/members/summary', auth, isAuthorized, assemblyController.getSummary);

// Desactivación lógica (solo admin / admin_master). No existe DELETE físico.
router.patch('/:productId/members/:id/deactivate', auth, isAdmin, assemblyController.deactivateMember);

module.exports = router;
