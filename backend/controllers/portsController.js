const Ports = require('../models/ports');
const Devices = require('../models/devices');

async function list(req, res) {
  try {
    const deviceId = req.query.device_id;
    if (!deviceId) return res.status(400).json({ error: 'device_id requerido' });
    const ports = await Ports.listPortsByDevice(deviceId);
    return res.json({ data: ports });
  } catch (err) {
    console.error('ports.list error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function getById(req, res) {
  try {
    const id = req.params.id;
    const port = await Ports.getPortById(id);
    if (!port) return res.status(404).json({ error: 'Puerto no encontrado' });
    return res.json({ data: port });
  } catch (err) {
    console.error('ports.getById error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function create(req, res) {
  try {
    const body = req.body || {};
    if (!body.device_id || !body.name || !body.type) {
      return res.status(400).json({ error: 'device_id, name y type son requeridos' });
    }
    const device = await Devices.getDeviceById(body.device_id);
    if (!device) return res.status(400).json({ error: 'Dispositivo no encontrado' });
    const result = await Ports.createPort(body);
    return res.status(201).json({ id: result.id });
  } catch (err) {
    console.error('ports.create error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const allowed = ['name', 'type', 'status'];
    const fields = {};
    for (const k of allowed) {
      if (body[k] !== undefined) fields[k] = body[k];
    }
    if (!Object.keys(fields).length) return res.status(400).json({ error: 'Nada para actualizar' });
    const port = await Ports.getPortById(id);
    if (!port) return res.status(404).json({ error: 'Puerto no encontrado' });
    await Ports.updatePort(id, fields);
    return res.json({ ok: true });
  } catch (err) {
    console.error('ports.update error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function remove(req, res) {
  try {
    const id = req.params.id;
    const port = await Ports.getPortById(id);
    if (!port) return res.status(404).json({ error: 'Puerto no encontrado' });
    await Ports.deletePort(id);
    return res.json({ ok: true });
  } catch (err) {
    console.error('ports.delete error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function available(req, res) {
  try {
    const deviceId = req.params.deviceId;
    const ports = await Ports.getAvailablePorts(deviceId);
    return res.json({ data: ports });
  } catch (err) {
    console.error('ports.available error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { list, getById, create, update, remove, available };
