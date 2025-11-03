const { getPool, query } = require('../db');

async function listPortsByDevice(deviceId) {
  return await query('SELECT id, device_id, name, type, status FROM ports WHERE device_id=? ORDER BY id', [deviceId]);
}

async function getPortById(id) {
  const rows = await query('SELECT * FROM ports WHERE id=?', [id]);
  return rows[0] || null;
}

async function createPort({ device_id, name, type, status = 'available' }) {
  const [r] = await getPool().execute(
    'INSERT INTO ports (device_id, name, type, status) VALUES (?,?,?,?)',
    [device_id, name, type, status]
  );
  return { id: r.insertId };
}

async function updatePort(id, fields) {
  const cols = [];
  const vals = [];
  for (const [k, v] of Object.entries(fields)) { cols.push(`${k}=?`); vals.push(v); }
  if (!cols.length) return;
  vals.push(id);
  await getPool().execute(`UPDATE ports SET ${cols.join(', ')} WHERE id=?`, vals);
}

async function deletePort(id) {
  await getPool().execute('DELETE FROM ports WHERE id=?', [id]);
}

async function getAvailablePorts(deviceId) {
  return await query('SELECT id, name, type FROM ports WHERE device_id=? AND status="available"', [deviceId]);
}

module.exports = { listPortsByDevice, getPortById, createPort, updatePort, deletePort, getAvailablePorts };
