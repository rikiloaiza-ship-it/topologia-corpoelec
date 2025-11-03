(function (global) {
  const WIFI_TYPES = new Set(['ap','wifi','router','gateway','controller','repeater','access_point','ap_wifi','wireless_ap']);
  const SWITCH_TYPES = new Set(['switch','core_switch','distribution_switch','access_switch','layer2_switch','layer3_switch']);

  const instances = new Map();

  function nodeCategory(type) {
    const t = String(type || '').toLowerCase().trim();
    if (WIFI_TYPES.has(t)) return 'wifi';
    if (SWITCH_TYPES.has(t)) return 'switch';
    return 'other';
  }

  function hasNum(n){ return Number.isFinite(n); }

  function zoomIn(containerId, factor = 1.2) {
    const cy = instances.get(containerId);
    if (cy) {
      cy.zoom({
        level: cy.zoom() * factor,
        renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
      });
    }
  }

  function zoomOut(containerId, factor = 1.2) {
    const cy = instances.get(containerId);
    if (cy) {
      cy.zoom({
        level: cy.zoom() / factor,
        renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
      });
    }
  }

  function fitView(containerId, padding = 60) {
    const cy = instances.get(containerId);
    if (cy) {
      const elements = cy.elements();
      
      if (elements.length === 0) return;
      
      cy.animate({
        fit: {
          eles: elements,
          padding: padding
        },
        duration: 600
      });
    }
  }

  function toggleBackground(containerId) {
    const cy = instances.get(containerId);
    if (cy) {
      const container = cy.container();
      const currentBg = container.style.backgroundColor;
      
      if (!currentBg || currentBg === 'white' || currentBg === 'rgb(255, 255, 255)' || currentBg === '') {
        container.style.backgroundColor = '#111522';
      } else {
        container.style.backgroundColor = 'white';
      }
    }
  }

  function searchNodes(containerId, query) {
    const cy = instances.get(containerId);
    if (!cy) return;
  
    cy.elements().removeClass('highlighted-search');
    
    if (!query.trim()) {
      return;
    }
  
    const searchTerm = query.toLowerCase().trim();
    const matchingNodes = cy.nodes().filter(node => {
      const data = node.data();
      const searchableText = [
        data.label,
        data.ip,
        data.mac,
        data.type
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchTerm);
    });
  
    matchingNodes.addClass('highlighted-search');
    
    if (matchingNodes.length > 0) {
      cy.animate({
        fit: {
          eles: matchingNodes,
          padding: 80
        },
        duration: 600
      });
    }
  }

  function getEnhancedStyles() {
    const base = baseStyle();
    base.push(
      {
        selector: 'node.highlighted-search',
        style: {
          'border-width': 4,
          'border-color': '#e74c3c',
          'background-color': '#e67e22',
          'width': 50,
          'height': 50
        }
      }
    );
    return base;
  }

  function mapElements(graph) {
    const nodes = (graph.nodes || []).map(n => {
      let meta = {};
      if (n.metadata) {
        try {
          meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
        } catch (e) {
          console.warn('Error parsing metadata for node', n.id, e);
        }
      }
      const p = meta.pos || meta.position || (hasNum(n.x) && hasNum(n.y) ? { x: n.x, y: n.y } : null);
      return {
        group: 'nodes',
        data: {
          id: String(n.id),
          label: n.label || String(n.id),
          type: n.type || 'device',
          category: nodeCategory(n.type),
          ip: n.ip || '',
          mac: n.mac || '',
          network_id: n.network_id,
          ghost: n.ghost === true ? 'true' : 'false' ,
          image_id: n.image_id || null
        },
        position: p && hasNum(p.x) && hasNum(p.y) ? { x: Number(p.x), y: Number(p.y) } : undefined
      };
    });
    const edges = (graph.edges || []).map(e => ({
      group: 'edges',
      data: {
        id: String(e.id || (e.source + '->' + e.target)),
        source: String(e.source),
        target: String(e.target),
        label: e.type || '',
        link_type: e.type || '',
        status: e.status || '',
        network_id: e.network_id,
        cross: e.cross === true ? 'true' : 'false'
      }
    }));
    return { nodes, edges };
  }

  function baseStyle() {
    return [
      { selector: 'node',
        style: {
          'width': 36, 'height': 36, 'shape': 'ellipse',
          'background-color': '#bdc3c7', 'border-width': 2, 'border-color': '#95a5a6',
          'label': 'data(label)', 'font-size': 10, 'font-weight': 600, 'color': '#2c3e50',
          'text-wrap': 'wrap', 'text-max-width': 100, 'text-valign': 'bottom', 'text-halign': 'center', 'text-margin-y': 8,
        }
      },
      { selector: 'node[category = "wifi"]',
        style: { 'shape': 'hexagon', 'background-color': '#3498db', 'border-color': '#2980b9' }
      },
      { selector: 'node[category = "switch"]',
        style: { 'shape': 'round-rectangle', 'background-color': '#2ecc71', 'border-color': '#27ae60' }
      },
      { selector: 'node[type = "router"]',
        style: { 'shape': 'diamond', 'background-color': '#e67e22', 'border-color': '#d35400' }
      },
      { selector: 'node:selected', style: { 'border-color': '#e74c3c', 'border-width': 3 } },
      { selector: 'node:hover',    style: { 'cursor': 'pointer' } },
      { selector: 'edge',
        style: {
          'width': 2, 'line-color': '#95a5a6', 'curve-style': 'bezier', 'target-arrow-shape': 'none',
          'label': 'data(label)', 'font-size': 8, 'text-rotation': 'autorotate', 'color': '#34495e',
          'text-margin-y': -5
        }
      },
      { selector: 'node[image_id]',
      style: {
        'background-image': (ele) => `/api/images/${ele.data('image_id')}`,
        'background-fit': 'cover',
        'background-clip': 'node',
        'shape': 'rectangle', 
        'width': 40, 'height': 40
      }
    }, 
      { selector: 'node[ghost = "true"]',
      style: { 
        'opacity': 0.35,
        'border-style': 'dashed',
        'border-color': '#7f8c8d',
        'background-color': '#95a5a6'
      }
    }, 
    { selector: 'edge[cross = "true"]',
    style: {
      'line-style': 'dashed',
      'opacity': 0.55
    }
  }, 
  { selector: 'edge:selected', 
      style: { 
        'line-color': '#3498db', 
        'width': 3 
      } }
    ];
  }

  function hasPreset(elements) {
    return (elements.nodes || []).some(n => n.position && hasNum(n.position.x) && hasNum(n.position.y));
  }

  function layoutFor(elements, viewType = 'all') {
    if (hasPreset(elements)) return { name: 'preset', fit: false, padding: 30 };
    
    const nodeCount = elements.nodes ? elements.nodes.length : 0;
    
    // Para redes pequeñas
    if (nodeCount <= 10) {
      return {
        name: 'circle',
        animate: 'end',
        animationDuration: 800,
        fit: true,
        padding: 80,
        radius: null,
        startAngle: 0,
        sweep: 360
      };
    }
    
    // Para redes de switches
    if (viewType === 'switches') {
      return {
        name: 'breadthfirst',
        animate: 'end',
        animationDuration: 1000,
        fit: true,
        padding: 60,
        directed: true,
        circle: false,
        spacingFactor: 1.1,
        avoidOverlap: true
      };
    }
    
    // Para redes WiFi
    if (viewType === 'wifi') {
      return {
        name: 'breadthfirst',
        animate: 'end',
        animationDuration: 1200,
        fit: true,
        padding: 60,
        nodeRepulsion: 6000,
        idealEdgeLength: 120,
        edgeElasticity: 0.3,
        nestingFactor: 0.2,
        gravity: 0.1,
        numIter: 3000
      };
    }
    
    return {
      name: 'breadthfirst',
      animate: 'end',
      animationDuration: 1000,
      fit: true,
      padding: 60,
      nodeRepulsion: 4500,
      idealEdgeLength: 100,
      edgeElasticity: 0.45,
      nestingFactor: 0.1,
      gravity: 0.25,
      numIter: 2500
    };
  }

  function ensure(containerId) {
    const el = document.getElementById(containerId);
    if (!el) { console.warn('Canvas: no existe #' + containerId); return null; }
  
    let cy = instances.get(containerId);
    if (cy && cy.destroyed()) { cy = null; instances.delete(containerId); }
  
    if (!cy) {
      cy = cytoscape({
        container: el,
        style: getEnhancedStyles(),
        wheelSensitivity: 0.2,
        boxSelectionEnabled: true,
        selectionType: 'single',
        pixelRatio: 1,
        minZoom: 0.1,
        maxZoom: 5,
        userPanningEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        zoomingEnabled: true
      });
  
      cy.on('wheel', (event) => {
      });

      cy.on('grab', 'node', function(evt) {
        evt.target.trigger('grabon');
      });
  
      cy.on('free', 'node', function(evt) {
        evt.target.trigger('graboff');
      });
  
      const onResize = () => { 
        try { 
          cy.resize(); 
          cy.fit(cy.elements(), 40); 
        } catch (_) {} 
      };
      const debounced = debounce(onResize, 120);
      window.addEventListener('resize', debounced);
  
      cy.on('tap', 'node', ev => {
        const d = ev.target.data();
        console.log('Nodo clickeado:', d);
      });

      cy.on('cxttap', 'node', ev => {
        ev.originalEvent.preventDefault();
        document.dispatchEvent(new CustomEvent('node:contextmenu', { 
          detail: { 
            node: ev.target.data(), 
            clientX: ev.originalEvent.clientX, 
            clientY: ev.originalEvent.clientY 
          } 
        }));
      });
      
      cy.on('cxttap', 'edge', ev => {
        ev.originalEvent.preventDefault();
        document.dispatchEvent(new CustomEvent('edge:contextmenu', { 
          detail: { 
            edge: ev.target.data(), 
            clientX: ev.originalEvent.clientX, 
            clientY: ev.originalEvent.clientY 
          } 
        }));
      });    

      cy.on('dbltap', 'node', ev => {
        cy.animate({
          center: { eles: ev.target },
          duration: 400
        });
      });

      cy.on('dragfree', 'node', function(evt) {
        const node = evt.target;
        const id = node.id();
        const position = node.position();
       
        API.updateDevice(id, { metadata: { pos: { x: position.x, y: position.y } } })
          .then(() => {
            console.log(`Posición guardada para nodo ${id}: (${position.x}, ${position.y})`);
          })
          .catch(err => {
            console.error('Error guardando posición:', err);
          });
      });
  
      instances.set(containerId, cy);
    }
    return cy;
  }

  function debounce(fn, wait){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(null,a), wait); }; }

  function renderGraph(graph, opts = {}) {
    const containerId = opts.containerId || 'canvas';
    const viewType = opts.viewType || 'all';
    const cy = ensure(containerId);
    if (!cy) return;
  
    const elements = mapElements(graph);
    cy.stop();
    cy.elements().remove();
    cy.add(elements.nodes);
    cy.add(elements.edges);
  
    const layout = layoutFor(elements, viewType);
    const layoutInstance = cy.layout(layout);
    
    layoutInstance.run();
    
    setTimeout(() => {
      cy.fit(cy.elements(), 60);

      if (cy.zoom() > 2) cy.zoom(2);
      if (cy.zoom() < 0.5) cy.zoom(0.5);
    }, 100);
  
    cy.scratch('_graphMeta', { 
      network_id: graph.network_id, 
      kind: graph.kind || 'all',
      viewType: viewType 
    });
  }

  function fit(containerId, padding = 40) {
    const cy = instances.get(containerId);
    if (cy) cy.fit(cy.elements(), padding);
  }

  function destroy(containerId) {
    const cy = instances.get(containerId);
    if (!cy) return;
    try {
      const c = cy.scratch('_cleanup');
      if (c?.debounced) window.removeEventListener('resize', c.debounced);
    } catch (_) {}
    cy.destroy();
    instances.delete(containerId);
  }

  global.Canvas = { 
    renderGraph, 
    fit, 
    destroy, 
    zoomIn, 
    zoomOut, 
    fitView, 
    toggleBackground, 
    searchNodes 
  };
})(window);