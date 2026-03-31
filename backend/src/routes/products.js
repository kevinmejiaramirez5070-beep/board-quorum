const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, isAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas de productos
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.get('/:id/stats', productController.getStats);
router.post('/', isAdmin, productController.create);
router.put('/:id', isAdmin, productController.update);
router.delete('/:id', isAdmin, productController.delete);

module.exports = router;
