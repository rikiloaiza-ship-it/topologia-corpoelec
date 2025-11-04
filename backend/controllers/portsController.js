const Ports = require('../models/ports');
const Devices = require('../models/devices');

async function list(req, res) {
  try {
    const deviceId = req.params.id;
    if (!deviceId) return res.status(400).json({ error: 'device_id requerido' });
    const device = await Devices.getDeviceById(deviceId);
    if (!device) return res.status(404).json({ error: 'Dispositivo no encontrado' });
    const rows = await Ports.listPortsByDevice(deviceId);
    return res.json({ data: rows });
  } catch (err) {
    console.error('ports.list error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function upsert(req, res) {
  try {
    const deviceId = req.params.id;
    const body = req.body || {};
    const ports = body.ports || [];
    if (!Array.isArray(ports)) return res.status(400).json({ error: 'ports debe ser array' });
    const device = await Devices.getDeviceById(deviceId);
    if (!device) return res.status(404).json({ error: 'Dispositivo no encontrado' });
    await Ports.upsertPorts(deviceId, ports);
    return res.json({ ok: true });
  } catch (err) {
    console.error('ports.upsert error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { list, upsert };
