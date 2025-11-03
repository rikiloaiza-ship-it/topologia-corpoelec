const { getPool, query } = require('../db');

async function listConnectionsByNetwork(networkId) {
  return await query(
    'SELECT id, network_id, from_device_id, to_device_id, from_port_id, to_port_id, link_type, status, created_at FROM connections WHERE network_id=? ORDER BY id',
    [networkId]
  );
}

async function getConnectionById(id) {
  const rows = await query(
    'SELECT id, network_id, from_device_id, to_device_id, from_port_id, to_port_id, link_type, status, created_at FROM connections WHERE id=?',
    [id]
  );
  return rows[0] || null;
}

// Cambia esta función: Agrega from_port_id, to_port_id en INSERT y valida puertos
async function createConnection({ network_id, from_device_id, to_device_id, from_port_id = null, to_port_id = null, link_type = null, status = 'unknown' }) {
  // Agrega validación: Si se especifican puertos, verificar que pertenezcan a los dispositivos y estén disponibles
  if (from_port_id) {
    const fromPort = await query('SELECT * FROM ports WHERE id=? AND device_id=? AND status="available"', [from_port_id, from_device_id]);
    if (!fromPort.length) throw new Error('Puerto origen no válido o ocupado');
  }
  if (to_port_id) {
    const toPort = await query('SELECT * FROM ports WHERE id=? AND device_id=? AND status="available"', [to_port_id, to_device_id]);
    if (!toPort.length) throw new Error('Puerto destino no válido o ocupado');
  }
  const [r] = await getPool().execute(
    'INSERT INTO connections (network_id, from_device_id, to_device_id, from_port_id, to_port_id, link_type, status) VALUES (?,?,?,?,?,?,?)',
    [network_id, from_device_id, to_device_id, from_port_id, to_port_id, link_type, status]
  );
  // Marca puertos como usados si se conectaron
  if (from_port_id) await getPool().execute('UPDATE ports SET status="used" WHERE id=?', [from_port_id]);
  if (to_port_id) await getPool().execute('UPDATE ports SET status="used" WHERE id=?', [to_port_id]);
  return { id: r.insertId };
}

async function updateConnection(id, fields) {
  // Agrega validación similar a createConnection si se actualizan puertos
  if (fields.from_port_id || fields.to_port_id) {
    const conn = await getConnectionById(id);
    if (!conn) throw new Error('Conexión no encontrada');
    if (fields.from_port_id) {
      const fromPort = await query('SELECT * FROM ports WHERE id=? AND device_id=? AND status="available"', [fields.from_port_id, conn.from_device_id]);
      if (!fromPort.length) throw new Error('Puerto origen no válido o ocupado');
    }
    if (fields.to_port_id) {
      const toPort = await query('SELECT * FROM ports WHERE id=? AND device_id=? AND status="available"', [fields.to_port_id, conn.to_device_id]);
      if (!toPort.length) throw new Error('Puerto destino no válido o ocupado');
    }
    // Libera puertos antiguos si cambian
    if (conn.from_port_id && conn.from_port_id !== fields.from_port_id) await getPool().execute('UPDATE ports SET status="available" WHERE id=?', [conn.from_port_id]);
    if (conn.to_port_id && conn.to_port_id !== fields.to_port_id) await getPool().execute('UPDATE ports SET status="available" WHERE id=?', [conn.to_port_id]);
    // Marca nuevos como usados
    if (fields.from_port_id) await getPool().execute('UPDATE ports SET status="used" WHERE id=?', [fields.from_port_id]);
    if (fields.to_port_id) await getPool().execute('UPDATE ports SET status="used" WHERE id=?', [fields.to_port_id]);
  }
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
  const conn = await getConnectionById(id);
  if (conn) {
    // Libera puertos al eliminar
    if (conn.from_port_id) await getPool().execute('UPDATE ports SET status="available" WHERE id=?', [conn.from_port_id]);
    if (conn.to_port_id) await getPool().execute('UPDATE ports SET status="available" WHERE id=?', [conn.to_port_id]);
  }
  await getPool().execute('DELETE FROM connections WHERE id=?', [id]);
}

module.exports = {
  listConnectionsByNetwork,
  getConnectionById,
  createConnection,
  updateConnection,
  deleteConnection
};