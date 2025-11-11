(function () {
  const THEME_KEY = 'theme';
  const root = document.documentElement;
  window.connectMode = false;
  window.selectedPortA = null;
  let tooltipEl = null;

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (persist) try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    
    if (window.Canvas?.updateTheme) {
      window.Canvas.updateTheme('canvas-wifi', theme);
      window.Canvas.updateTheme('canvas-switches', theme);
    }
  }
  
  function getStoredTheme() { try { return localStorage.getItem(THEME_KEY); } catch { return null; } }
  function getSystemTheme() { const m = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null; return (m && m.matches) ? 'dark' : 'light'; }


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
  
  function initSitePanel() {
    const networkId = new URLSearchParams(location.search).get('network_id') || '1';
    const panel = document.createElement('div');
    panel.id = 'site-panel';
    panel.innerHTML = `
      <h3>Vista por Sede</h3>
      <div id="site-tree"></div>
      <!-- NUEVO: Toggle para conexiones inter-sede -->
      <label style="margin-top: 10px; display: block;">
        <input type="checkbox" id="show-inter-site" checked> Mostrar conexiones inter-sede
      </label>
    `;
    

    panel.style.backgroundColor = 'var(--surface-1)'; 
    panel.style.border = '1px solid var(--border)';
    panel.style.borderRadius = '8px';
    panel.style.padding = '10px';
    
    const main = document.querySelector('.app-main');
    main.insertBefore(panel, main.firstElementChild); 
    
    API.getSites(networkId).then(sites => {
      const treeData = [
        {
          id: 'general',
          text: 'General',
          parent: '#',
          data: { site_id: null }
        },
        ...sites.map(s => ({
          id: s.id.toString(),
          text: s.name,
          parent: s.parent_id ? s.parent_id.toString() : '#',
          data: { site_id: s.id }
        }))
      ];
      
 
      $('#site-tree').jstree({
        core: {
          data: treeData,
          themes: { responsive: true }
        },
        plugins: ['types', 'state'], 
        types: {
          default: { icon: 'jstree-folder' }, 
          leaf: { icon: 'jstree-file' }  
        },
        state: { key: 'site-tree' }
      });
      
      $('#site-tree').on('ready.jstree', function() {
        $('#site-tree').jstree('open_all');
      });
      
      $('#site-tree').on('select_node.jstree', function(e, data) {
        const selectedId = data.node.data.site_id; 
        GRAPH_CACHE.clear();
        const showInter = document.getElementById('show-inter-site').checked;
        loadGraphFor(getCurrentView(), selectedId, { showInterSite: showInter });
        
      });
      
      document.getElementById('show-inter-site').addEventListener('change', (e) => {
        GRAPH_CACHE.clear();
        const showInter = e.target.checked;
        loadGraphFor(getCurrentView(), getCurrentSiteId(), { showInterSite: showInter });
      });
    }).catch(err => console.error('Error cargando sedes:', err));
  }
  
  
  async function handleExportExcel() {
    try {
      const networkId = new URLSearchParams(location.search).get('network_id') || '1';
      const view = getCurrentView(); 
      const full = await fetchFullGraph(networkId, getCurrentSiteId()); 
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
  
      const wb = XLSX.utils.book_new();
      const wsNodes = XLSX.utils.json_to_sheet(nodesData);
      const wsEdges = XLSX.utils.json_to_sheet(edgesData);
      XLSX.utils.book_append_sheet(wb, wsNodes, 'Nodos');
      XLSX.utils.book_append_sheet(wb, wsEdges, 'Enlaces');
  
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
    const connectBtn = document.getElementById('connect-ports-btn'); 
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        window.connectMode = true;
        window.selectedPortA = null;
        setStatus('Modo conectar: selecciona dispositivo origen (puerto libre)', false);
      });
    }
  
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
  
    const detailsModal = document.getElementById('details-modal');
    const detailsClose = document.getElementById('details-close');
    const detailsClose2 = document.getElementById('details-close-2');
    detailsClose?.addEventListener('click', () => closeModal(detailsModal));
    detailsClose2?.addEventListener('click', () => closeModal(detailsModal));
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
    const detailsBtn = document.getElementById('details-btn'); // ← nuevo

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
            await loadGraphFor(getCurrentView(), getCurrentSiteId())
          } catch (err) {
            alert('Error eliminando: ' + err.message);
          }
        }
      });
    }
    
    if (detailsBtn) {
      detailsBtn.addEventListener('click', async function() {
        const menu = document.getElementById('context-menu');
        const type = menu?.dataset?.type;
        const id = menu?.dataset?.id;
        hideContextMenu();
        if (!type || !id) {
          alert('Tipo o ID no definidos en el menú de contexto');
          return;
        }
        if (type !== 'device') {
          alert('Detalles sólo disponibles para dispositivos');
          return;
        }
        try {
          await openDetailsModal(id);
        } catch (err) {
          console.error('Error mostrando detalles:', err);
          alert('Error cargando detalles: ' + (err?.message || 'desconocido'));
        }
      });
    }
  }

  async function openDetailsModal(deviceId) {
    const modal = document.getElementById('details-modal');
    const imageWrap = document.getElementById('details-image');
    const generalWrap = document.getElementById('details-general');
    const summaryWrap = document.getElementById('details-ports-summary');
    const listWrap = document.getElementById('details-ports-list');
  
    if (imageWrap) imageWrap.innerHTML = '';
    if (generalWrap) generalWrap.innerHTML = '';
    if (summaryWrap) summaryWrap.innerHTML = '';
    if (listWrap) listWrap.innerHTML = '';
  
    try {
      const device = await API.getDevice(deviceId);
      const ports = await API.getPorts(deviceId); // array de puertos
      const total = ports.length;
      const used = ports.filter(p => p.connected === true).length;
      const free = total - used;
  
      if (imageWrap) {
        if (device.image_id) {
          const img = document.createElement('img');
          img.src = `/api/images/${device.image_id}`;
          img.alt = device.name || 'Imagen dispositivo';
          img.style.maxWidth = '110px';
          img.style.borderRadius = '8px';
          img.style.border = '1px solid var(--border)';
          imageWrap.appendChild(img);
        } else {
          imageWrap.innerHTML = '<div style="color:var(--muted); font-size:13px;">Sin imagen</div>';
        }
      }
  
      if (generalWrap) {
        const nameEl = `<div style="font-weight:700; font-size:16px;">${escapeHtml(device.name || '—')}</div>`;
        const ipEl = `<div style="color:var(--muted)">IP: ${escapeHtml(device.ip_address || '—')}</div>`;
        const other = `<div style="margin-top:6px; font-size:13px;">
          Tipo: ${escapeHtml(device.device_type || '—')} • MAC: ${escapeHtml(device.mac_address || '—')}
          <div style="margin-top:4px;">Ubicación: ${escapeHtml(device.location || '—')}</div>
        </div>`;
        generalWrap.innerHTML = nameEl + ipEl + other;
      }
  
      if (summaryWrap) {
        summaryWrap.innerHTML = `<strong>Puertos</strong>: ${total} total • ${used} conectados • ${free} libres`;
      }
  
      if (listWrap) {
        if (!ports || ports.length === 0) {
          listWrap.innerHTML = `<div style="color:var(--muted)">No hay puertos registrados.</div>`;
        } else {
          const ul = document.createElement('ul');
          ul.style.listStyle = 'none';
          ul.style.padding = '0';
          ul.style.margin = '0';
          ports.forEach(p => {
            const li = document.createElement('li');
            li.style.padding = '6px 0';
            li.style.borderBottom = '1px dashed rgba(0,0,0,0.06)';
            const status = p.connected ? 'Usado' : 'Libre';
            let connInfo = '';
            if (p.connected && p.connection_to) {
              connInfo = ` • Conectado a ${escapeHtml(String(p.connection_to) || p.remote_device || '—')}`;
            } else if (p.connected && (p.a_connection || p.b_connection)) {
              connInfo = ` • ${escapeHtml(String(p.a_connection || p.b_connection))}`;
            } else if (p.connected && p.peer) {
              connInfo = ` • ${escapeHtml(String(p.peer))}`;
            }
            li.innerHTML = `<strong>${escapeHtml(p.name)}</strong> — ${escapeHtml(p.kind || '')} — ${status}${connInfo}`;
            ul.appendChild(li);
          });
          listWrap.appendChild(ul);
        }
      }
  
      if (modal) { modal.hidden = false; modal.setAttribute('aria-hidden', 'false'); }
    } catch (err) {
      console.error('openDetailsModal error', err);
      alert('No se pudo obtener detalles del dispositivo: ' + (err?.message || 'error'));
    }
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function openDeviceModal(device = null) {
    const modal = document.getElementById('device-modal');
    const form = document.getElementById('device-form');
    const title = document.getElementById('device-title');
    const networkId = new URLSearchParams(location.search).get('network_id') || '1';
    const imageInput = document.getElementById('device-image');
    const previewDiv = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeBtn = document.getElementById('remove-image');
    
    // remove existing selector container to avoid duplicates
    const existingContainer = document.getElementById('site-selector-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // load sites
    let sites = [];
    try {
      sites = await API.getSites(networkId);
    } catch (err) {
      console.error('Error cargando sedes para el modal:', err);
      alert('No se pudo cargar las sedes. Intenta más tarde.');
      return;
    }
  
    // build DOM for site selector
    const siteContainer = document.createElement('div');
    siteContainer.id = 'site-selector-container';
    const siteLabel = document.createElement('label');
    siteLabel.textContent = 'Sede (con búsqueda y árbol)';
    const siteDiv = document.createElement('div');
    siteDiv.id = 'device-site-tree'; // evita colisión con #site-tree
    siteContainer.appendChild(siteLabel);
    siteContainer.appendChild(siteDiv);
  
    // search input for the tree
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar sede...';
    searchInput.style.marginBottom = '10px';
    siteContainer.insertBefore(searchInput, siteDiv);
  
    // insert site container after the location input if present, otherwise append to the form
    const locationEl = document.getElementById('device-location');
    if (locationEl && locationEl.parentNode) {
      locationEl.insertAdjacentElement('afterend', siteContainer);
    } else {
      form.appendChild(siteContainer);
    }
  
    // prepare tree data from sites
    const treeData = sites.map(s => ({
      id: String(s.id),
      text: s.name,
      parent: s.parent_id ? String(s.parent_id) : '#',
      data: { site_id: s.id }
    }));
  
    // destroy existing jstree instance if any (prevents duplicates / event stacking)
    try {
      const inst = $('#device-site-tree').jstree(true);
      if (inst) {
        $('#device-site-tree').jstree('destroy');
      }
    } catch (e) {
      // ignore if not initialized
    }
  
    // init jstree
    $('#device-site-tree').jstree({
      core: {
        data: treeData,
        themes: { responsive: true }
      },
      plugins: ['search'],
      search: {
        show_only_matches: true,
        show_only_matches_children: true
      }
    });
  
    // wire search box to jstree
    searchInput.addEventListener('keyup', function() {
      $('#device-site-tree').jstree('search', this.value);
    });
  
    // selection handler: write hidden input site_id into the form
    $('#device-site-tree').on('select_node.jstree', function(e, data) {
      const selectedId = data.node.id;
      let hiddenField = document.getElementById('device-site-hidden');
      if (!hiddenField) {
        hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.id = 'device-site-hidden';
        hiddenField.name = 'site_id';
        form.appendChild(hiddenField);
      }
      hiddenField.value = selectedId;
    });
  
    // if editing existing device, select its site when tree is ready
    if (device && device.site_id) {
      $('#device-site-tree').on('ready.jstree', function() {
        try {
          $('#device-site-tree').jstree('select_node', String(device.site_id));
        } catch (_) {}
      });
    }
  
    // image preview handlers (keep as before)
    if (device && device.image_id) {
      previewImg.src = `/api/images/${device.image_id}`;
      previewDiv.style.display = 'block';
      if (imageInput) imageInput.value = '';
    } else {
      previewDiv.style.display = 'none';
    }
  
    if (imageInput) {
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => { previewImg.src = reader.result; previewDiv.style.display = 'block'; };
          reader.readAsDataURL(file);
        }
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        if (imageInput) imageInput.value = '';
        previewDiv.style.display = 'none';
      });
    }
  
    // fill form fields when editing
    if (device) {
      console.log('Device data:', device);
      if (title) title.textContent = 'Editar Dispositivo';
      document.getElementById('device-id').value = device.id;
      document.getElementById('device-name').value = device.name;
      document.getElementById('device-type').value = device.device_type;
      document.getElementById('device-ip').value = device.ip_address || '';
      document.getElementById('device-mac').value = device.mac_address || '';
      document.getElementById('device-location').value = device.location || '';
      try {
        const ports = await API.getPorts(device.id);
        if (ports && ports.length > 0) {
          const portsCountEl = document.getElementById('device-ports-count');
          const portsTypeEl = document.getElementById('device-ports-type');
          if (portsCountEl) portsCountEl.value = ports.length;
          if (portsTypeEl) portsTypeEl.value = ports[0].kind || 'gigabit-ethernet';
        } else {
          const pc = document.getElementById('device-ports-count');
          if (pc) pc.value = '';
          const pt = document.getElementById('device-ports-type');
          if (pt) pt.value = 'gigabit-ethernet';
        }
      } catch (err) {
        console.error('Error cargando puertos:', err);
      }
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
      await loadGraphFor(getCurrentView(), getCurrentSiteId())
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
    const portsCount = parseInt(document.getElementById('device-ports-count')?.value) || 0;
    const portsType = document.getElementById('device-ports-type')?.value;
    let imageId = null;
    const networkIdStr = new URLSearchParams(location.search).get('network_id') || '1';
    const networkId = parseInt(networkIdStr);
  
    if (isNaN(networkId)) {
      alert('ID de red inválido. Verifica la URL.');
      return;
    }
  
    let data = {};
  
    if (portsCount > 0) {
      data.ports = [];
      for (let i = 1; i <= portsCount; i++) {
        data.ports.push({
          name: `${portsType === 'wifi' ? 'WLAN' : (portsType === 'fast-ethernet' ? 'Fa' : 'Gi')}0/${i}`,
          kind: portsType,
          speed_mbps: portsType === 'fast-ethernet' ? 100 : 1000,
          position: i
        });
      }
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
  
    data.network_id = networkId;
    data.name = document.getElementById('device-name')?.value;
    data.device_type = document.getElementById('device-type')?.value;
    data.ip_address = document.getElementById('device-ip')?.value || null;
    data.mac_address = document.getElementById('device-mac')?.value || null;
    data.location = document.getElementById('device-location')?.value || null;
    data.image_id = imageId;
    data.site_id = document.getElementById('device-site-hidden')?.value ? parseInt(document.getElementById('device-site-hidden').value, 10) : null;
    try {
      if (id) await API.updateDevice(id, data);
      else await API.createDevice(data);
      GRAPH_CACHE.clear();
      await loadGraphFor(getCurrentView(), getCurrentSiteId())
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
      await loadGraphFor(getCurrentView(), getCurrentSiteId())
      closeModal(modal);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }
  
  
  function getCurrentView() {
    const tabWifi = document.getElementById('tab-wifi');
    return tabWifi && tabWifi.checked ? 'wifi' : 'switches';
  }

  function getCurrentSiteId() {
    const selector = document.getElementById('site-selector');
    return selector ? (selector.value || null) : null;
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

  initSitePanel();

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
    const tabId = view === 'switches' ? 'tab-switches' : 'tab-wifi'; 
    const target = document.getElementById(tabId);    
    if (target) target.checked = true;
    if (view === 'all') {
      await loadGraphFor('all', getCurrentSiteId());
    } else {
      await loadGraphFor(view === 'switches' ? 'switches' : 'wifi', getCurrentSiteId());
    }
  }
  

  function setViewAndLoad(view) {
    const params = new URLSearchParams(location.search);
    if (view === 'all') params.delete('view'); else params.set('view', view);
    const url = location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.replaceState({}, '', url);
    loadGraphFor(view, getCurrentSiteId());
  }

const GRAPH_CACHE = new Map();

async function fetchFullGraph(networkId, siteId = null) {
  const cacheKey = `${networkId}_${siteId || 'general'}`; 
  if (GRAPH_CACHE.has(cacheKey)) return GRAPH_CACHE.get(cacheKey);
  const full = await API.getGraph(networkId, { site_id: siteId }); 
  GRAPH_CACHE.set(cacheKey, full);
  return full;
}

async function computeNodePortsSummary(deviceId) {
  try {
    const ports = await API.getPorts(deviceId);
    const total = ports.length;
    const used = ports.filter(p => p.connected === true).length;
    return { ports, ports_summary: { total, used } };
  } catch (e) {
    return { ports: [], ports_summary: { total: 0, used: 0 } };
  }
}


function nodeCategory(type) {
  if (window.Canvas && typeof window.Canvas.nodeCategory === 'function') {
    return window.Canvas.nodeCategory(type);
  }
  const t = String(type || '').toLowerCase().trim();
  if (['ap','wifi','router','gateway','controller','repeater','access_point','ap_wifi','wireless_ap','wifi_ap','ap-bridge'].includes(t)) return 'wifi';
  if (['switch','core_switch','distribution_switch','access_switch','layer2_switch','layer3_switch','l2_switch','l3_switch'].includes(t)) return 'switch';
  return 'other';
}

function projectGraphForView(full, view, opts = {}) {
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

  let viewEdges = edges  
    .filter(e => primaryIds.has(String(e.source)) || primaryIds.has(String(e.target)))
    .map(e => {
      const sIn = primaryIds.has(String(e.source));
      const tIn = primaryIds.has(String(e.target));
      return { ...e, cross: (sIn && !tIn) || (!sIn && tIn) }; 
    });
  if (opts.showInterSite === false) {
    viewEdges = viewEdges.filter(e => e.cross !== true);
  }

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


async function loadGraphFor(view, siteId, opts = {}) {
  try {
    if (!siteId) siteId = getCurrentSiteId();  
    if (siteId === undefined) siteId = getCurrentSiteId(); 
    const params = new URLSearchParams(location.search);
    const networkId = params.get('network_id') || '1';
    const label = view === 'wifi' ? 'WiFi' : (view === 'switches' ? 'Red Corporativa' : 'Todo');
    if (typeof setStatus === 'function') setStatus(`Cargando red ${networkId} (${label})…`);

    const full = await fetchFullGraph(networkId, siteId); 
    let projected = projectGraphForView(full, view, opts);  
    const containerId = view === 'switches' ? 'canvas-switches' : 'canvas-wifi';
    const otherId = containerId === 'canvas-wifi' ? 'canvas-switches' : 'canvas-wifi';
    if (document.getElementById(otherId)) {
      if (window.Canvas?.destroy) window.Canvas.destroy(otherId);
      document.getElementById(otherId).innerHTML = '';
    }

    if (window.Canvas?.renderGraph) {
      window.Canvas.renderGraph(projected, { 
        containerId: containerId,
        viewType: view,
        siteId: siteId
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
  
async function openPortSelectionModal(deviceId, portType) {
  const ports = await API.getPorts(deviceId);
  const freePorts = ports.filter(p => !p.connected); 

  if (freePorts.length === 0) {
    alert('No hay puertos libres en este dispositivo.');
    return;
  }
  const modal = document.createElement('div');
  modal.id = 'port-modal';
  modal.innerHTML = `
    <div style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px; border:1px solid #ccc; z-index:10000;">
      <h3>Seleccionar Puerto ${portType} para Dispositivo ${deviceId}</h3>
      <select id="port-select">
        ${freePorts.map(p => `<option value="${p.id}">${p.name} (${p.kind})</option>`).join('')}
      </select>
      <button id="port-ok">OK</button>
      <button id="port-cancel">Cancelar</button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('port-ok').addEventListener('click', async () => {
    const selectedPortIdStr = document.getElementById('port-select').value;
    const selectedPort = freePorts.find(p => String(p.id) === String(selectedPortIdStr));
    if (portType === 'A') {
      window.selectedPortA = { 
        deviceId: parseInt(deviceId, 10), 
        portId: parseInt(selectedPortIdStr, 10),
        portName: selectedPort?.name || null
      };
      setStatus('Puerto origen seleccionado. Selecciona dispositivo destino.', false);
    } else {
      const networkId = parseInt(new URLSearchParams(location.search).get('network_id') || '1', 10);
      const bPortId = parseInt(selectedPortIdStr, 10);
      const bPortName = selectedPort?.name || null;
      const data = {
        network_id: networkId,
        from_device_id: parseInt(window.selectedPortA.deviceId, 10),
        to_device_id: parseInt(deviceId, 10),
        a_port_id: parseInt(window.selectedPortA.portId, 10),
        b_port_id: bPortId,
        a_port_name: window.selectedPortA.portName || null,
        b_port_name: bPortName,
        link_type: 'ethernet',
        status: 'up'
      };
      try {
        await API.createConnection(data);
        GRAPH_CACHE.clear();
        await loadGraphFor(getCurrentView(), getCurrentSiteId());
        window.connectMode = false;
        window.selectedPortA = null;
        setStatus('Conexión creada.', false);
      } catch (err) {
        alert('Error creando conexión: ' + err.message);
      }
    }
    document.body.removeChild(modal);
  });
  document.getElementById('port-cancel').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

window.openPortSelectionModal = openPortSelectionModal;

})();