const { getPool, query } = require('../db');

async function listConnectionsByNetwork(networkId) {
  return await query(
    'SELECT id, network_id, from_device_id, to_device_id, link_type, status, created_at FROM connections WHERE network_id=? ORDER BY id',
    [networkId]
  );
}

async function getConnectionById(id) {
  const rows = await query(
    'SELECT id, network_id, from_device_id, to_device_id, link_type, status, created_at FROM connections WHERE id=?',
    [id]
  );
  return rows[0] || null;
}

async function createConnection({ network_id, from_device_id, to_device_id, link_type = null, status = 'unknown' }) {
  const [r] = await getPool().execute(
    'INSERT INTO connections (network_id, from_device_id, to_device_id, link_type, status) VALUES (?,?,?,?,?)',
    [network_id, from_device_id, to_device_id, link_type, status]
  );
  return { id: r.insertId };
}

async function updateConnection(id, fields) {
  const cols = [];
  const vals = [];
  for (const [k, v] of Object.entries(fields)) {
    cols.push(`${k}=?`);
    vals.push(v);
  }
  if (!cols.length) return;
  vals.push(id);
  await getPool().execute(`UPDATE connections SET ${cols.join(', ')} WHERE id=?`, vals);
}

async function deleteConnection(id) {
  await getPool().execute('DELETE FROM connections WHERE id=?', [id]);
}

module.exports = {
  listConnectionsByNetwork,
  getConnectionById,
  createConnection,
  updateConnection,
  deleteConnection
};