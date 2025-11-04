const { getPool, query } = require('../db');

async function listDevicesByNetwork(networkId) {
  return await query(
    'SELECT id, network_id, name, ip_address, mac_address, device_type, location, image_id, metadata, created_at, updated_at FROM devices WHERE network_id=? ORDER BY id',
    [networkId]
  );
}

async function getDeviceById(id) {
  const rows = await query('SELECT * FROM devices WHERE id=?', [id]);
  return rows[0] || null;
}

async function createDevice({ network_id, name, device_type, ip_address = null, mac_address = null, location = null, image_id = null, metadata = null }) {
  const [r] = await getPool().execute(
    'INSERT INTO devices (network_id, name, ip_address, mac_address, device_type, location, image_id, metadata) VALUES (?,?,?,?,?,?,?,?)',
    [network_id, name, ip_address, mac_address, device_type, location, image_id, metadata]
  );
  return { id: r.insertId };
}

async function updateDevice(id, fields) {
  const cols = [];
  const vals = [];
  for (const [k, v] of Object.entries(fields)) { cols.push(`${k}=?`); vals.push(v); }
  if (!cols.length) return;
  vals.push(id);
  await getPool().execute(`UPDATE devices SET ${cols.join(', ')} WHERE id=?`, vals);
}

async function deleteDevice(id) {
  await getPool().execute('DELETE FROM devices WHERE id=?', [id]);
}

async function getPortsByDeviceId(deviceId) {
  const Ports = require('./ports');
  return await Ports.listPortsByDevice(deviceId);
}

module.exports = { listDevicesByNetwork, getDeviceById, createDevice, updateDevice, deleteDevice, getPortsByDeviceId  };