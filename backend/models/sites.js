const { getPool, query } = require('../db');

async function listSitesByNetwork(networkId) {
  // Incluir parent_id en la query
  return await query('SELECT id, network_id, name, description, parent_id, created_at FROM sites WHERE network_id=? ORDER BY name', [networkId]);
}

async function getSiteById(id) {
  const rows = await query('SELECT * FROM sites WHERE id=?', [id]);
  return rows[0] || null;
}

// Las demás funciones (createSite, updateSite, deleteSite) ya están bien, pero asegúrate de que createSite acepte parent_id
async function createSite({ network_id, name, description = null, parent_id = null }) {
  const [r] = await getPool().execute(
    'INSERT INTO sites (network_id, name, description, parent_id) VALUES (?,?,?,?)',
    [network_id, name, description, parent_id]
  );
  return { id: r.insertId };
}

async function updateSite(id, fields) {
  const cols = [];
  const vals = [];
  for (const [k, v] of Object.entries(fields)) { cols.push(`${k}=?`); vals.push(v); }
  if (!cols.length) return;
  vals.push(id);
  await getPool().execute(`UPDATE sites SET ${cols.join(', ')} WHERE id=?`, vals);
}

async function deleteSite(id) {
  await getPool().execute('DELETE FROM sites WHERE id=?', [id]);
}

module.exports = { listSitesByNetwork, getSiteById, createSite, updateSite, deleteSite };