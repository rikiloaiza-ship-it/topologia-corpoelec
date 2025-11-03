(function () {
  const THEME_KEY = 'theme';
  const root = document.documentElement;
  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (persist) try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }
  function getStoredTheme() { try { return localStorage.getItem(THEME_KEY); } catch { return null; } }
  function getSystemTheme() { const m = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null; return (m && m.matches) ? 'dark' : 'light'; }

  (function initThemeFromStorage() {
    const stored = getStoredTheme();
    const theme = stored || getSystemTheme();
    try { root.dataset.theme = theme; root.style.colorScheme = theme; } catch (e) {}
  })();

  function setStatus(text, isError) {
    try {
      const dot = document.querySelector('.status-dot');
      const t = document.querySelector('.status-text') || document.querySelector('.status');
      if (dot) {
        dot.classList.remove('status--ok', 'status--error', 'status--unknown', 'status--danger');
        dot.classList.add(isError ? 'status--error' : 'status--ok');
      }
      if (t) t.textContent = text;
    } catch (e) {
      console.error('setStatus error:', e);
    }
  }
  try { window.setStatus = setStatus; } catch (e) {}

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      initThemeToggle();
      bindLogoutButton();
      bindUIControls();
      bindCRUDButtons();
      bindModals();
      bindContextMenuActions();

      const page = detectPage();
      if (page === 'login') {
        if (typeof setStatus === 'function') setStatus('Listo para iniciar sesión');
        return;
      }
  
      const ok = await Auth.requireAuthOnPage();
      if (!ok) return; 
  
      populateUserBadge();
      bindTabsSafely();
      await initViewFromQuerySafely();
    } catch (err) {
      console.error('app init error', err);
      if (typeof setStatus === 'function') setStatus('Error inicializando la página', true);
    }
  });

  function bindUIControls() {
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const fitBtn = document.getElementById('fit-view');
    const backgroundBtn = document.getElementById('toggle-background');
    const searchInput = document.getElementById('device-search');
    const exportBtn = document.getElementById('export-excel');
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExportExcel);
    }
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', handleZoomIn);
    }
  
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', handleZoomOut);
    }
  
    if (fitBtn) {
      fitBtn.addEventListener('click', handleFitView);
    }
  
    if (backgroundBtn) {
      backgroundBtn.addEventListener('click', handleToggleBackground);
    }
  
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          handleSearch(e);
        }
      });
    }
  }
  
  async function handleExportExcel() {
    try {
      const networkId = new URLSearchParams(location.search).get('network_id') || '1';
      const view = getCurrentView(); 
      const full = await fetchFullGraph(networkId);
      const projected = projectGraphForView(full, view);
        const nodesData = (projected.nodes || []).map(n => ({
        ID: n.id,
        Nombre: n.label || n.id,
        Tipo: n.type,
        Categoría: n.category,
        IP: n.ip || '',
        MAC: n.mac || '',
        Ubicación: n.location || '',
        Red_ID: n.network_id,
        Fantasma: n.ghost ? 'Sí' : 'No'
      }));
  
      const edgesData = (projected.edges || []).map(e => ({
        ID: e.id,
        Origen: e.source,
        Destino: e.target,
        Tipo_Enlace: e.link_type || '',
        Estado: e.status || '',
        Cruzado: e.cross ? 'Sí' : 'No',
        Red_ID: e.network_id
      }));
  
      // Crear workbook
      const wb = XLSX.utils.book_new();
      const wsNodes = XLSX.utils.json_to_sheet(nodesData);
      const wsEdges = XLSX.utils.json_to_sheet(edgesData);
      XLSX.utils.book_append_sheet(wb, wsNodes, 'Nodos');
      XLSX.utils.book_append_sheet(wb, wsEdges, 'Enlaces');
  
      // Generar archivo y descargar
      const fileName = `grafo_red_${networkId}_${view}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
  
      if (typeof setStatus === 'function') setStatus('Archivo Excel exportado: ' + fileName);
    } catch (err) {
      console.error('Error exportando a Excel:', err);
      if (typeof setStatus === 'function') setStatus('Error al exportar: ' + err.message, true);
    }
  }
  
  function bindCRUDButtons() {
    const addDeviceBtn = document.getElementById('add-device');
    const addConnectionBtn = document.getElementById('add-connection');
    if (addDeviceBtn) addDeviceBtn.addEventListener('click', () => openDeviceModal());
    if (addConnectionBtn) addConnectionBtn.addEventListener('click', () => openConnectionModal());
  }
  
  function bindModals() {
    // Dispositivo
    const deviceForm = document.getElementById('device-form');
    const deviceModal = document.getElementById('device-modal');
    const deviceClose = document.getElementById('device-close');
    const deviceCancel = document.getElementById('device-cancel');
    if (deviceForm) deviceForm.addEventListener('submit', handleDeviceSubmit);
    [deviceClose, deviceCancel].forEach(btn => btn?.addEventListener('click', () => closeModal(deviceModal)));
  
    // Conexión
    const connectionForm = document.getElementById('connection-form');
    const connectionModal = document.getElementById('connection-modal');
    const connectionClose = document.getElementById('connection-close');
    const connectionCancel = document.getElementById('connection-cancel');
    if (connectionForm) connectionForm.addEventListener('submit', handleConnectionSubmit);
    [connectionClose, connectionCancel].forEach(btn => btn?.addEventListener('click', () => closeModal(connectionModal)));
  
    const confirmModal = document.getElementById('confirm-modal');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');
    confirmYes?.addEventListener('click', handleConfirmYes);
    confirmNo?.addEventListener('click', () => closeModal(confirmModal));
  }

  function bindLogoutButton() {
    const logout = document.getElementById('logout-btn');
    if (!logout) return;
    logout.addEventListener('click', () => {
      GRAPH_CACHE.clear();
      Auth.clearAuth();
      location.replace('./login.html');
    });
  }

  function bindContextMenuActions() {
    const editBtn = document.getElementById('edit-btn');
    const deleteBtn = document.getElementById('delete-btn');

    if (editBtn) {
      editBtn.addEventListener('click', async function() {
        const menu = document.getElementById('context-menu');
        const type = menu?.dataset?.type;
        const id = menu?.dataset?.id;
        hideContextMenu();
        if (!type || !id) {
          alert('Tipo o ID no definidos en el menú de contexto');
          return;
        }

        if (type === 'device') {
          try {
            const device = await API.getDevice(id);  
            openDeviceModal(device);
          } catch (err) {
            alert('Error obteniendo dispositivo: ' + err.message);
          }
        } else if (type === 'connection') {
          try {
            const connection = await API.getConnection(id);  
            openConnectionModal(connection);
          } catch (err) {
            alert('Error obteniendo conexión: ' + err.message);
          }
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async function() {
        const menu = document.getElementById('context-menu');
        const type = menu?.dataset?.type;
        const id = menu?.dataset?.id;
        hideContextMenu();
        if (!type || !id) {
          alert('Error: Tipo o ID no definidos. Revisa la consola.');
          return;
        }
      
        if (confirm(`¿Estás seguro de eliminar este ${type === 'device' ? 'dispositivo' : 'conexión'}?`)) {
          try {
            if (type === 'device') {
              await API.deleteDevice(id);
            } else if (type === 'connection') {
              await API.deleteConnection(id);
            }
            GRAPH_CACHE.clear();
            await loadGraphFor(getCurrentView());
          } catch (err) {
            alert('Error eliminando: ' + err.message);
          }
        }
      });
    }
  }

  function openDeviceModal(device = null) {
    const modal = document.getElementById('device-modal');
    const form = document.getElementById('device-form');
    const title = document.getElementById('device-title');
    const networkId = new URLSearchParams(location.search).get('network_id') || '1';
    const imageInput = document.getElementById('device-image');
    const previewDiv = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeBtn = document.getElementById('remove-image');
    if (device && device.image_id) {

      previewImg.src = `/api/images/${device.image_id}`;
      previewDiv.style.display = 'block';
      imageInput.value = ''; 
    } else {
      previewDiv.style.display = 'none';
    }
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => { previewImg.src = reader.result; previewDiv.style.display = 'block'; };
        reader.readAsDataURL(file);
      }
    });
    removeBtn.addEventListener('click', () => {
      imageInput.value = '';
      previewDiv.style.display = 'none';
    });
    if (device) {
      console.log('Device data:', device);
      if (title) title.textContent = 'Editar Dispositivo';
      document.getElementById('device-id').value = device.id;
      document.getElementById('device-name').value = device.name;  
      document.getElementById('device-type').value = device.device_type;  
      document.getElementById('device-ip').value = device.ip_address || ''; 
      document.getElementById('device-mac').value = device.mac_address || ''; 
      document.getElementById('device-location').value = device.location || '';
    } else {
      if (title) title.textContent = 'Agregar Dispositivo';
      if (form) form.reset();
      const idEl = document.getElementById('device-id'); if (idEl) idEl.value = '';
    }
    if (modal) { modal.hidden = false; modal.setAttribute('aria-hidden', 'false'); }
  }
  
  async function openConnectionModal(connection = null) {
    const modal = document.getElementById('connection-modal');
    const form = document.getElementById('connection-form');
    const title = document.getElementById('connection-title');
    const networkId = new URLSearchParams(location.search).get('network_id') || '1';
    
    try {
      const devices = await API.getDevices(networkId);
      const fromSelect = document.getElementById('connection-from');
      const toSelect = document.getElementById('connection-to');
      if (!fromSelect || !toSelect) throw new Error('Selects de conexión no encontrados en el DOM');
      fromSelect.innerHTML = '<option value="">Seleccionar dispositivo...</option>';
      toSelect.innerHTML = '<option value="">Seleccionar dispositivo...</option>';
      devices.forEach(d => {
        const opt = `<option value="${d.id}">${d.name} (ID: ${d.id})</option>`;
        fromSelect.innerHTML += opt;
        toSelect.innerHTML += opt;
      });
    } catch (err) {
      alert('Error cargando dispositivos: ' + err.message);
      return;
    }
    
    if (connection) {
      if (title) title.textContent = 'Editar Conexión';
      document.getElementById('connection-id').value = connection.id;
      document.getElementById('connection-from').value = connection.from_device_id;  
      document.getElementById('connection-to').value = connection.to_device_id;  
      document.getElementById('connection-link-type').value = connection.link_type || '';  
      document.getElementById('connection-status').value = connection.status || 'unknown';
    } else {
      if (title) title.textContent = 'Agregar Conexión';
      if (form) form.reset();
      const idEl = document.getElementById('connection-id'); if (idEl) idEl.value = '';
    }
    if (modal) { modal.hidden = false; modal.setAttribute('aria-hidden', 'false'); }
  }
  
  async function handleConnectionSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('connection-id')?.value;
    const fromId = parseInt(document.getElementById('connection-from')?.value);
    const toId = parseInt(document.getElementById('connection-to')?.value);
    
    const networkIdStr = new URLSearchParams(location.search).get('network_id') || '1';
    const networkId = parseInt(networkIdStr);
    
    if (isNaN(networkId) || isNaN(fromId) || isNaN(toId)) {
      alert('Datos inválidos: verifica la red y los dispositivos seleccionados.');
      return;
    }
    if (fromId === toId) {
      alert('No puedes conectar un dispositivo a sí mismo.');
      return;
    }
    
    const data = {
      network_id: networkId, 
      from_device_id: fromId,
      to_device_id: toId,
      link_type: document.getElementById('connection-link-type')?.value || null,
      status: document.getElementById('connection-status')?.value
    };
    try {
      if (id) await API.updateConnection(id, data);
      else await API.createConnection(data);
      GRAPH_CACHE.clear();
      await loadGraphFor(getCurrentView());
      closeModal(document.getElementById('connection-modal'));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }
  
  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }
  
  async function handleDeviceSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('device-id')?.value;
    const imageInput = document.getElementById('device-image');
    let imageId = null;
    const networkIdStr = new URLSearchParams(location.search).get('network_id') || '1';
    const networkId = parseInt(networkIdStr);
    
    if (isNaN(networkId)) {
      alert('ID de red inválido. Verifica la URL.');
      return;
    }

    if (imageInput.files[0]) {
      const formData = new FormData();
      formData.append('image', imageInput.files[0]);
      try {
        const res = await fetch('/api/images', {
          method: 'POST',
          body: formData,
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (!res.ok) throw new Error('Error subiendo imagen');
        const imgData = await res.json();
        imageId = imgData.id;
      } catch (err) {
        alert('Error subiendo imagen: ' + err.message);
        return;
      }
    }
    
    const data = {
      network_id: networkId,  
      name: document.getElementById('device-name')?.value,
      device_type: document.getElementById('device-type')?.value,
      ip_address: document.getElementById('device-ip')?.value || null,
      mac_address: document.getElementById('device-mac')?.value || null,
      location: document.getElementById('device-location')?.value || null,
      image_id: imageId

    };
    try {
      if (id) await API.updateDevice(id, data);
      else await API.createDevice(data);
      GRAPH_CACHE.clear();
      await loadGraphFor(getCurrentView());
      closeModal(document.getElementById('device-modal'));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  function openConfirmModal(type, item) {
    const modal = document.getElementById('confirm-modal');
    const message = document.getElementById('confirm-message');
    if (!modal || !message) return;
    message.textContent = `¿Eliminar ${type === 'device' ? 'dispositivo' : 'conexión'} ${item.id}?`;
    modal.dataset.type = type;
    modal.dataset.id = item.id;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }
  
  async function handleConfirmYes() {
    const modal = document.getElementById('confirm-modal');
    const type = modal?.dataset?.type;
    const id = modal?.dataset?.id;
    try {
      if (type === 'device') await API.deleteDevice(id);
      else await API.deleteConnection(id);
      GRAPH_CACHE.clear();
      await loadGraphFor(getCurrentView());
      closeModal(modal);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }
  
  function getCurrentView() {
    const tabWifi = document.getElementById('tab-wifi');
    return tabWifi && tabWifi.checked ? 'wifi' : 'switches';
  }
  function handleZoomIn() {
    const containerId = getActiveContainerId();
    if (window.Canvas?.zoomIn) {
      window.Canvas.zoomIn(containerId);
    }
  }
  
  function handleZoomOut() {
    const containerId = getActiveContainerId();
    if (window.Canvas?.zoomOut) {
      window.Canvas.zoomOut(containerId);
    }
  }
  
  function handleFitView() {
    const containerId = getActiveContainerId();
    if (window.Canvas?.fitView) {
      window.Canvas.fitView(containerId);
    }
  }
  
  function handleToggleBackground() {
    const containerId = getActiveContainerId();
    if (window.Canvas?.toggleBackground) {
      window.Canvas.toggleBackground(containerId);
    }
  }
  
  function handleSearch(event) {
    const containerId = getActiveContainerId();
    const query = event.target.value;
    if (window.Canvas?.searchNodes) {
      window.Canvas.searchNodes(containerId, query);
    }
  }
  
function getActiveContainerId() {
  const tabWifi = document.getElementById('tab-wifi');
  const tabSwitches = document.getElementById('tab-switches');
  
  if (tabWifi && tabWifi.checked) {
    return 'canvas-wifi';
  }
  if (tabSwitches && tabSwitches.checked) {
    return 'canvas-switches';
  }
  
  const viewWifi = document.getElementById('view-wifi');
  const viewSwitches = document.getElementById('view-switches');
  
  if (viewWifi && viewWifi.style.display !== 'none') {
    return 'canvas-wifi';
  }
  if (viewSwitches && viewSwitches.style.display !== 'none') {
    return 'canvas-switches';
  }
  
  return 'canvas-wifi'; 
}
  // --- helpers ---
  function detectPage() {
    const dp = document.body?.dataset?.page;
    if (dp) return dp.toLowerCase();
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return file.replace('.html', '') || 'index';
  }

  function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const isDark = (document.documentElement.dataset.theme || '').toLowerCase() === 'dark';
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.addEventListener('click', () => {
      const current = (document.documentElement.dataset.theme || 'light').toLowerCase();
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
    });
  }

  function populateUserBadge() {
    const badge = document.getElementById('user-badge');
    if (!badge) return;
    try {
      const user = Auth.getUser() || {};
      if (user.username) {
        badge.textContent = user.username + (user.role ? ' (' + user.role + ')' : '');
        badge.title = 'Sesión activa';
      } else {
        badge.textContent = 'Usuario';
      }
    } catch (_) { badge.textContent = 'Usuario'; }
  }

  function bindTabsSafely() {
    const rWifi = document.getElementById('tab-wifi');
    const rSw   = document.getElementById('tab-switches');
    if (!rWifi && !rSw) return;
    if (rWifi) rWifi.addEventListener('change', () => { if (rWifi.checked) setViewAndLoad('wifi'); });
    if (rSw)   rSw.addEventListener('change',   () => { if (rSw.checked)   setViewAndLoad('switches'); });
  }

  async function initViewFromQuerySafely() {
    const hasViewControls = document.querySelector('input[name="view"]') ||
                            document.querySelector('#canvas-wifi') ||
                            document.querySelector('#canvas-switches') ||
                            document.getElementById('canvas');
    if (!hasViewControls) return;

    const params = new URLSearchParams(location.search);
    const view = params.get('view') || 'all';
    const tabId = view === 'switches' ? 'tab-switches' : 'tab-wifi'; const target = document.getElementById(tabId);    if (target) target.checked = true;
    if (view === 'all') {
      await loadGraphFor('all');
    } else {
      await loadGraphFor(view === 'switches' ? 'switches' : 'wifi');
    }
  }

  function setViewAndLoad(view) {
    const params = new URLSearchParams(location.search);
    if (view === 'all') params.delete('view'); else params.set('view', view);
    const url = location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.replaceState({}, '', url);
    loadGraphFor(view);
  }

const GRAPH_CACHE = new Map();

async function fetchFullGraph(networkId) {
  if (GRAPH_CACHE.has(networkId)) return GRAPH_CACHE.get(networkId);
  const full = await API.getGraph(networkId, {}); 
  GRAPH_CACHE.set(networkId, full);
  return full;
}

/* ====== projectGraphForView (restaura la función faltante) ====== */
function isWifiType(t) {
  t = String(t || '').toLowerCase().trim();
  return ['ap','wifi','router','gateway','controller','repeater','access_point','ap_wifi','wireless_ap','wifi_ap','ap-bridge'].includes(t);
}
function isSwitchType(t) {
  t = String(t || '').toLowerCase().trim();
  return ['switch','core_switch','distribution_switch','access_switch','layer2_switch','layer3_switch','l2_switch','l3_switch'].includes(t);
}
function nodeCategory(type) {
  if (isWifiType(type)) return 'wifi';
  if (isSwitchType(type)) return 'switch';
  return 'other';
}

function projectGraphForView(full, view) {
  if (!full) return { network_id: null, nodes: [], edges: [], counts: { nodes: 0, edges: 0 }, kind: 'all' };

  if (view === 'all') {
    const counts = full.counts || {
      nodes: (full.nodes || []).length,
      edges: (full.edges || []).length
    };
    return { ...full, counts, kind: 'all' };
  }

  const desired = view === 'wifi' ? 'wifi' : 'switch';
  const nodes = full.nodes || [];
  const edges = full.edges || [];

  const primaryNodes = nodes.filter(n => nodeCategory(n.type) === desired);
  const primaryIds = new Set(primaryNodes.map(n => String(n.id)));

  const viewEdges = edges
    .filter(e => primaryIds.has(String(e.source)) || primaryIds.has(String(e.target)))
    .map(e => {
      const sIn = primaryIds.has(String(e.source));
      const tIn = primaryIds.has(String(e.target));
      return { ...e, cross: (sIn && !tIn) || (!sIn && tIn) }; 
    });

  const neededIds = new Set();
  viewEdges.forEach(e => { neededIds.add(String(e.source)); neededIds.add(String(e.target)); });
  const ghostNodes = nodes
    .filter(n => neededIds.has(String(n.id)) && !primaryIds.has(String(n.id)))
    .map(n => ({ ...n, ghost: true }));

  const viewNodes = [...primaryNodes, ...ghostNodes];

  return {
    network_id: full.network_id,
    kind: desired,
    nodes: viewNodes,
    edges: viewEdges,
    counts: { nodes: viewNodes.length, edges: viewEdges.length }
  };
}
/* ============================================================= */

async function loadGraphFor(view) {
  try {
    const params = new URLSearchParams(location.search);
    const networkId = params.get('network_id') || '1';
    const label = view === 'wifi' ? 'WiFi' : (view === 'switches' ? 'Red Corporativa' : 'Todo');
    if (typeof setStatus === 'function') setStatus(`Cargando red ${networkId} (${label})…`);

    const full = await fetchFullGraph(networkId);

    const projected = projectGraphForView(full, view);

    const containerId = view === 'switches' ? 'canvas-switches' : 'canvas-wifi';
    const otherId = containerId === 'canvas-wifi' ? 'canvas-switches' : 'canvas-wifi';
    if (document.getElementById(otherId)) {
      if (window.Canvas?.destroy) window.Canvas.destroy(otherId);
      document.getElementById(otherId).innerHTML = '';
    }

    if (window.Canvas?.renderGraph) {
      window.Canvas.renderGraph(projected, { 
        containerId: containerId,
        viewType: view
      });
    } else {
      document.dispatchEvent(new CustomEvent('graph:loaded', { detail: { ...projected, _containerId: containerId } }));
    }

    const counts = projected.counts || { nodes: projected.nodes?.length || 0, edges: projected.edges?.length || 0 };
    if (typeof setStatus === 'function') setStatus(`Red ${networkId} cargada (${label}): ${counts.nodes} nodos, ${counts.edges} enlaces`);
  } catch (e) {
    console.error(e);
    if (typeof setStatus === 'function') setStatus('Error al cargar grafo: ' + (e?.message || 'desconocido'), true);
  }
}


function showContextMenu(x, y, type, id) {
  console.log('showContextMenu llamado con:', { x, y, type, id }); 
  const menu = document.getElementById('context-menu');
  if (!menu) {
    console.error('Menú de contexto no encontrado');
    return;
  }
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.display = 'block';
  menu.dataset.type = type;
  menu.dataset.id = id;

  document.addEventListener('click', hideContextMenu, { once: true });
}
function hideContextMenu() {
  const menu = document.getElementById('context-menu');
  if (menu) menu.style.display = 'none';
}


document.addEventListener('node:contextmenu', function(evt) {
  console.log('Evento node:contextmenu recibido:', evt.detail);
  const nodeData = evt.detail.node;
  if (!nodeData || !nodeData.id) {
    console.error('Datos del nodo inválidos:', nodeData);
    return;
  }
  const rect = document.body.getBoundingClientRect();
  const position = {
    x: evt.detail.clientX - rect.left,
    y: evt.detail.clientY - rect.top
  };
  showContextMenu(position.x, position.y, 'device', nodeData.id);
});
  
  document.addEventListener('edge:contextmenu', function(evt) {
    console.log('Evento edge:contextmenu recibido:', evt.detail);
    const edgeData = evt.detail.edge;
    if (!edgeData || !edgeData.id) {
      console.error('Datos del edge inválidos:', edgeData);
      return;
    }
    const rect = document.body.getBoundingClientRect();
    const position = {
      x: evt.detail.clientX - rect.left,
      y: evt.detail.clientY - rect.top
    };
    showContextMenu(position.x, position.y, 'connection', edgeData.id);
  });
  
})();