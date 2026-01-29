const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const clientController = require('../controllers/clientController');

router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.post('/', auth, clientController.create);
router.put('/:id', auth, clientController.update);
router.delete('/:id', auth, clientController.delete);

module.exports = router;
