const Sites = require('../models/sites');

async function list(req, res) {
  try {
    const networkId = req.query.network_id;
    if (!networkId) return res.status(400).json({ error: 'network_id requerido' });
    const rows = await Sites.listSitesByNetwork(networkId);
    return res.json({ data: rows });
  } catch (err) {
    console.error('sites.list error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function getById(req, res) {
  try {
    const id = req.params.id;
    const site = await Sites.getSiteById(id);
    if (!site) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ data: site });
  } catch (err) {
    console.error('sites.getById error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function create(req, res) {
  try {
    const body = req.body || {};
    if (!body.network_id || !body.name) {
      return res.status(400).json({ error: 'network_id y name son requeridos' });
    }
    const result = await Sites.createSite(body);  // Ahora acepta parent_id si se pasa en body
    return res.status(201).json({ id: result.id });
  } catch (err) {
    console.error('sites.create error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const site = await Sites.getSiteById(id);
    if (!site) return res.status(404).json({ error: 'No encontrado' });
    // Permitir actualizar parent_id
    const allowed = ['name', 'description', 'parent_id'];
    const fields = {};
    for (const k of allowed) {
      if (body[k] !== undefined) fields[k] = body[k];
    }
    if (!Object.keys(fields).length) return res.status(400).json({ error: 'Nada para actualizar' });
    await Sites.updateSite(id, fields);
    return res.json({ ok: true });
  } catch (err) {
    console.error('sites.update error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function remove(req, res) {
  try {
    const id = req.params.id;
    const site = await Sites.getSiteById(id);
    if (!site) return res.status(404).json({ error: 'No encontrado' });
    await Sites.deleteSite(id);
    return res.json({ ok: true });
  } catch (err) {
    console.error('sites.delete error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { list, getById, create, update, remove };