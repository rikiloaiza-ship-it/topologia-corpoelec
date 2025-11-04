const Devices = require('../models/devices');

function serializeMeta(v) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  return typeof v === 'object' ? JSON.stringify(v) : v;
}

async function list(req, res) {
  try {
    const networkId = req.query.network_id;
    if (!networkId) return res.status(400).json({ error: 'network_id requerido' });

    const rows = await Devices.listDevicesByNetwork(networkId);
    return res.json({ data: rows });
  } catch (err) {
    console.error('devices.list error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function getById(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'id requerido' });

    const device = await Devices.getDeviceById(id);
    if (!device) return res.status(404).json({ error: 'No encontrado' });

    return res.json({ data: device });
  } catch (err) {
    console.error('devices.getById error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function create(req, res) {
  try {
    const body = req.body || {};
    if (!body.network_id || !body.name || !body.device_type) {
      return res.status(400).json({ error: 'network_id, name y device_type son requeridos' });
    }

    const payload = {
      network_id: body.network_id,
      name: body.name,
      device_type: body.device_type,
      ip_address: body.ip_address || null,
      mac_address: body.mac_address || null,
      location: body.location || null,
      image_id: body.image_id || null,
      metadata: serializeMeta(body.metadata) !== null && serializeMeta(body.metadata) !== undefined ? serializeMeta(body.metadata) : null
    };

    const result = await Devices.createDevice(payload);
    if (body.ports && Array.isArray(body.ports)) {
      const Ports = require('../models/ports');
      for (const p of body.ports) {
        await Ports.createPort({ device_id: result.id, ...p });
      }
    }
    return res.status(201).json({ id: result.id });
  } catch (err) {
    console.error('devices.create error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const body = req.body || {};
    if (!id) return res.status(400).json({ error: 'id requerido' });

    const allowed = ['name', 'device_type', 'ip_address', 'mac_address', 'location', 'image_id', 'metadata'];
    const fields = {};
    for (const k of allowed) {
      if (body[k] !== undefined) {
        if (k === 'metadata') {
          // Obtener metadata actual y mergear
          const device = await Devices.getDeviceById(id);
          let currentMeta = {};
          if (device.metadata) {
            try {
              currentMeta = JSON.parse(device.metadata);
            } catch (e) {
              console.warn('Error parsing existing metadata:', e);
            }
          }
          // Mergear: si body.metadata tiene pos, actualizarlo; de lo contrario, reemplazar todo
          const newMeta = { ...currentMeta, ...body[k] };
          fields[k] = serializeMeta(newMeta);
        } else {
          fields[k] = body[k];
        }
      }
    }
    if (!Object.keys(fields).length) return res.status(400).json({ error: 'Nada para actualizar' });

    const device = await Devices.getDeviceById(id);
    if (!device) return res.status(404).json({ error: 'No encontrado' });

    await Devices.updateDevice(id, fields);
    if (body.ports && Array.isArray(body.ports)) {
      const Ports = require('../models/ports');
      // Eliminar puertos existentes
      await query('DELETE FROM ports WHERE device_id=?', [id]);
      // Insertar los nuevos puertos
      for (const p of body.ports) {
        await Ports.createPort({ device_id: id, ...p });
      }
    }
  
    return res.json({ ok: true });
  } catch (err) {
    console.error('devices.update error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function remove(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'id requerido' });

    const device = await Devices.getDeviceById(id);
    if (!device) return res.status(404).json({ error: 'No encontrado' });

    await Devices.deleteDevice(id);
    return res.json({ ok: true });
  } catch (err) {
    console.error('devices.delete error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { list, getById, create, update, remove };