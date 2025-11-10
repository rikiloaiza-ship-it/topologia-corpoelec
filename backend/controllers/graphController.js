const Devices = require('../models/devices');
const Connections = require('../models/connections');
const Ports = require('../models/ports'); 

function tryParseMeta(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch (_e) { return v; }
}

const TYPE_MAP = {
  wifi: ['ap','wifi','router','gateway','controller','repeater','access_point','ap_wifi','wireless_ap','wifi_ap','ap-bridge'],
  switches: ['switch','core_switch','distribution_switch','access_switch','layer2_switch','layer3_switch','l2_switch','l3_switch']
};

function normalizeType(t) {
  return String(t || '').toLowerCase().trim();
}

function makeKindPredicate(kind) {
  if (!kind) return null;
  const allowed = TYPE_MAP[kind];
  if (!allowed) return null;
  const set = new Set(allowed.map(normalizeType));
  return (node) => set.has(normalizeType(node.type));
}

async function getGraphByNetwork(req, res) {
  try {
    const networkId = req.params.networkId;
    if (!networkId) return res.status(400).json({ error: 'networkId requerido' });

    const { kind, site_id } = req.query;

    const [devices, connections] = await Promise.all([
      Devices.listDevicesByNetwork(networkId),
      Connections.listConnectionsByNetwork(networkId)
    ]);

    let filteredDevices = devices;
    if (site_id) {
      filteredDevices = devices.filter(d => d.site_id == site_id);
      let tempEdges = connections.map(c => ({
        id: c.id,
        source: c.from_device_id,
        target: c.to_device_id
      }));
      const siteNodeIds = new Set(filteredDevices.map(d => d.id));
      tempEdges = tempEdges.filter(e => siteNodeIds.has(e.source));
      const externalTargets = new Set(tempEdges.map(e => e.target).filter(id => !siteNodeIds.has(id)));
      const externalNodes = devices.filter(d => externalTargets.has(d.id)).map(d => ({ ...d, ghost: true, invisible: true }));
      filteredDevices = [...filteredDevices, ...externalNodes];
    }

    const nodesPromises = filteredDevices.map(async (d) => {
      const deviceConnections = connections.filter(c => c.status === 'up' && (c.from_device_id === d.id || c.to_device_id === d.id));
      const deviceConnectedPorts = new Set();
      deviceConnections.forEach(c => {
        if (c.from_device_id === d.id && c.a_port_id) deviceConnectedPorts.add(c.a_port_id);
        if (c.to_device_id === d.id && c.b_port_id) deviceConnectedPorts.add(c.b_port_id);
      });
    
      const ports = await Ports.listPortsByDevice(d.id);
      const enrichedPorts = ports.map(p => ({ ...p, connected: deviceConnectedPorts.has(p.id) }));
      const total = enrichedPorts.length;
      const used = deviceConnectedPorts.size;
    
      return {
        id: d.id,
        network_id: d.network_id,
        label: d.name,
        type: d.device_type,
        ip: d.ip_address,
        mac: d.mac_address,
        location: d.location,
        image_id: d.image_id,
        site_id: d.site_id,
        site_path: d.site_path || null,
        metadata: tryParseMeta(d.metadata),
        ports: enrichedPorts,
        ports_summary: { total, used },
        ghost: !!d.ghost,
        invisible: !!d.invisible 
      };
    });
    let nodes = await Promise.all(nodesPromises);

    let edges = connections.map(c => ({
      id: c.id,
      network_id: c.network_id,
      source: c.from_device_id,
      target: c.to_device_id,
      type: c.link_type,
      status: c.status,
      a_port_name: c.a_port_name,
      b_port_name: c.b_port_name
    }));

    if (site_id) {
      const siteNodeIds = new Set(filteredDevices.map(d => d.id));
      edges = edges.filter(e => siteNodeIds.has(e.source));
      const externalTargets = new Set(edges.map(e => e.target).filter(id => !siteNodeIds.has(id)));
      const externalNodes = devices.filter(d => externalTargets.has(d.id)).map(d => ({ ...d, ghost: true, invisible: true }));
      filteredDevices = [...filteredDevices, ...externalNodes];
    }

    const pred = makeKindPredicate(kind);
    if (pred) {
      nodes = nodes.filter(pred);
      const keep = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => keep.has(e.source) && keep.has(e.target));
    }

    return res.json({
      network_id: Number(networkId),
      kind: kind || 'all',
      counts: { nodes: nodes.length, edges: edges.length },
      nodes,
      edges
    });
  } catch (err) {
    console.error('graph.getGraphByNetwork error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}



module.exports = { getGraphByNetwork };