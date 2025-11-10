const { getPool, query } = require('../db');

async function listSitesByNetwork(networkId) {
  const rows = await query('SELECT id, network_id, name, description, parent_id, created_at FROM sites WHERE network_id=? ORDER BY name', [networkId]);
  
  for (const row of rows) {
    row.site_path = await getSitePath(row.id);
  }
  return rows;
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

async function getSitePath(siteId, path = []) {
  const site = await getSiteById(siteId);
  if (!site) return path.reverse().join(' > ');
  path.push(site.name);
  if (site.parent_id) return getSitePath(site.parent_id, path);
  return path.reverse().join(' > ');
}

module.exports = { listSitesByNetwork, getSiteById, createSite, updateSite, deleteSite, getSitePath  };