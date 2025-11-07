const express = require('express');
const router = express.Router();
const Sites = require('../controllers/sitesController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
// Asume que crearás validadores en validators/sitesSchemas.js si es necesario

// Lectura
router.get('/', requireAuth, requirePermission('devices:read'), Sites.list);
router.get('/:id', requireAuth, requirePermission('devices:read'), Sites.getById);

// Escritura (solo admin)
router.post('/', requireAuth, requirePermission('devices:write'), Sites.create);
router.put('/:id', requireAuth, requirePermission('devices:write'), Sites.update);
router.delete('/:id', requireAuth, requirePermission('devices:write'), Sites.remove);

module.exports = router;