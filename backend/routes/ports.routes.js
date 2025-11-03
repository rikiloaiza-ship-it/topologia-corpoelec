const express = require('express');
const router = express.Router();
const Ports = require('../controllers/portsController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createPort, updatePort } = require('../validators/portSchemas');  // Crear estos schemas si es necesario

router.get('/', requireAuth, requirePermission('devices:read'), Ports.list);
router.get('/:id', requireAuth, requirePermission('devices:read'), Ports.getById);
router.post('/', requireAuth, requirePermission('devices:write'), validate(createPort), Ports.create);
router.put('/:id', requireAuth, requirePermission('devices:write'), validate(updatePort), Ports.update);
router.delete('/:id', requireAuth, requirePermission('devices:write'), Ports.remove);
router.get('/available/:deviceId', requireAuth, requirePermission('devices:read'), Ports.available);

module.exports = router;
