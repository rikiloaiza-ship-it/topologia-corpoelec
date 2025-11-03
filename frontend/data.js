(function (global) {
  async function fetchJson(path) {
    const res = await Auth.apiFetch(path, { method: 'GET' });
    if (!res.ok) {
      const msg = await safeMsg(res);
      throw new Error(msg || ('Error HTTP ' + res.status));
    }
    return res.json();
  }

  async function safeMsg(res) {
    try { const j = await res.json(); return j && (j.error || j.message); } catch (_e) { return ''; }
  }

  async function getDevices(networkId) {
    const res = await Auth.apiFetch(`/devices?network_id=${networkId}`);
    if (!res.ok) throw new Error('Error obteniendo dispositivos');
    const json = await res.json();
    return json.data;
  }

  async function getConnections(networkId) {
    const data = await fetchJson('/connections?network_id=' + encodeURIComponent(networkId));
    return data.data || [];
  }

  async function getDevice(id) {
    const res = await Auth.apiFetch(`/devices/${id}`);
    if (!res.ok) throw new Error('Error obteniendo dispositivo');
    const json = await res.json();
    return json.data; 
  }
  
  async function getConnection(id) {
    const res = await Auth.apiFetch(`/connections/${id}`);
    if (!res.ok) throw new Error('Error obteniendo conexión');
    const json = await res.json();
    return json.data;  
  }

  async function getGraph(networkId, opts = {}) {
    const params = new URLSearchParams();
    if (opts.kind) params.set('kind', opts.kind);
    const qs = params.toString();
    const path = '/networks/' + encodeURIComponent(networkId) + '/graph' + (qs ? ('?' + qs) : '');
    return fetchJson(path);
  }
  async function createDevice(data) {
    const res = await Auth.apiFetch('/devices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Error creando dispositivo');
    return res.json();
  }
  
  async function updateDevice(id, data) {
    const res = await Auth.apiFetch(`/devices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Error actualizando dispositivo');
    return res.json();
  }
  
  async function deleteDevice(id) {
    const res = await Auth.apiFetch(`/devices/${id}`, { 
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-cache' } 
    });
    if (!res.ok) throw new Error('Error eliminando dispositivo');
    return res.json();
  }
  
  async function createConnection(data) {
    const res = await Auth.apiFetch('/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Error creando conexión');
    return res.json();
  }
  
  async function updateConnection(id, data) {
    const res = await Auth.apiFetch(`/connections/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Error actualizando conexión');
    return res.json();
  }
  
  async function deleteConnection(id) {
    const res = await Auth.apiFetch(`/connections/${id}`, { 
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-cache' } 
    });
    if (!res.ok) throw new Error('Error eliminando conexión');
    return res.json();
  }
  global.API = { getDevices, getConnections, getGraph, createDevice, updateDevice, deleteDevice, createConnection, updateConnection, deleteConnection, getDevice, getConnection, };
})(window);