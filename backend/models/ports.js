const { getPool, query } = require('../db');

async function listPortsByDevice(deviceId) {
  return await query(
    'SELECT id, device_id, name, kind, speed_mbps, admin_status, oper_status, position, notes, created_at, updated_at FROM ports WHERE device_id=? ORDER BY position',
    [deviceId]
  );
}

async function createPort({ device_id, name, kind = 'other', speed_mbps = null, admin_status = 'up', oper_status = 'down', position = null, notes = null }) {
  const [r] = await getPool().execute(
    'INSERT INTO ports (device_id, name, kind, speed_mbps, admin_status, oper_status, position, notes) VALUES (?,?,?,?,?,?,?,?)',
    [device_id, name, kind, speed_mbps, admin_status, oper_status, position, notes]
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

async function upsertPorts(deviceId, ports) {
  // Borra existentes y inserta nuevos (simple upsert)
  await getPool().execute('DELETE FROM ports WHERE device_id=?', [deviceId]);
  for (const p of ports) {
    await createPort({ device_id: deviceId, ...p });
  }
}

module.exports = { listPortsByDevice, createPort, updatePort, deletePort, upsertPorts };
