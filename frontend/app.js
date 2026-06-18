/**
 * Knowledge Graph Editor v2
 */

// ---------- 前端日志系统 ----------
(function() {
  var _log = window.api && window.api.log;
  if (!_log) return;
  var _origLog = console.log;
  var _origError = console.error;
  var _origWarn = console.warn;
  console.log = function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    _log('INFO', msg).catch(function(){});
    _origLog.apply(console, arguments);
  };
  console.error = function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    _log('ERROR', msg).catch(function(){});
    _origError.apply(console, arguments);
  };
  console.warn = function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    _log('WARN', msg).catch(function(){});
    _origWarn.apply(console, arguments);
  };
  console.log('[Logger] 前端日志已启用');
})();

const state={network:null,nodes:null,edges:null,selectedType:null,selectedId:null,selFirst:null,selSecond:null,addingEdge:{active:false,fromId:null,fromLabel:null},currentFilePath:null,currentLayout:"force",tabNodeId:null};
const NC=["#E74C3C","#3498DB","#2ECC71","#9B59B6","#F39C12","#1ABC9C","#E67E22","#1E8449","#C0392B","#2980B9","#8E44AD","#D35400"];
const LP={force:{physics:{enabled:true,solver:"forceAtlas2Based",forceAtlas2Based:{gravitationalConstant:-2,centralGravity:.001,springLength:130,springConstant:.02,damping:.5},stabilization:{iterations:100,updateInterval:25},timestep:.5,adaptiveTimestep:true},layout:{improvedLayout:true},label:"力导向"},hierarchical:{physics:{enabled:false},layout:{hierarchical:{enabled:true,direction:"UD",sortMethod:"directed",levelSeparation:200,nodeSpacing:180,treeSpacing:250,blockShifting:true,edgeMinimization:true,parentCentralization:true}},label:"层次"},radial:{physics:{enabled:false},layout:{hierarchical:{enabled:true,direction:"UD",sortMethod:"hubsize",levelSeparation:180,nodeSpacing:200,treeSpacing:300,blockShifting:true,edgeMinimization:true,parentCentralization:false}},label:"辐射"}};
function ns(l){return Math.max(12,30-(Math.max(1,Math.min(10,l||1))-1)*3);}
function dh(h,f){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return"rgb("+Math.max(0,~~(r*(1-f)))+","+Math.max(0,~~(g*(1-f)))+","+Math.max(0,~~(b*(1-f)))+")";}
function lh(h,f){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return"rgb("+Math.min(255,~~(r+(255-r)*f))+","+Math.min(255,~~(g+(255-g)*f))+","+Math.min(255,~~(b+(255-b)*f))+")";}
function Cc(c){return{background:c,border:dh(c,.25),highlight:{background:lh(c,.25),border:"#1a1a2e"}};}
function Ce(c){return{color:c,highlight:"#4da6ff"};}
async function ca(a,p){const r=await window.api.call(a,p);if(!r.success)throw Error(r.error||"失败");return r.data;}
function sm(m){ console.log("[STATUS] "+m);document.getElementById("status-bar").textContent=m;}
function st(){document.getElementById("footer-stats").textContent="节点: "+state.nodes.length+" | 边: "+state.edges.length;}
function eh(s){document.getElementById("empty-hint").classList.toggle("hidden",!s);}
function tp(n){const p=n.properties||{};let t="<b>"+(n.label||"")+"</b>";if(Object.keys(p).length){t+="<hr>";for(const[k,v]of Object.entries(p))t+="<div>"+k+": "+v+"</div>";}return t;}
function hAP(){["panel-empty","panel-node","panel-edge","panel-add-edge"].forEach(function(id){document.getElementById(id).classList.add("hidden");});}
function uLD(lv){for(var i=1;i<=5;i++){var d=document.getElementById("ld-"+i);if(d)d.classList.toggle("active",i<=lv);}}

// ===== initNetwork =====
function initNet() { console.log("[INIT] initNet() start");
  if(typeof vis === 'undefined') { throw Error("vis-network CDN 未加载，请检查网络"); }
  var ct = document.getElementById('graph-vis');
  if(!ct) { throw Error("画布容器 #graph-vis 不存在"); }
  state.nodes = new vis.DataSet([]); state.edges = new vis.DataSet([]);
  var base = {
    autoResize: true,
    interaction: { hover: true, tooltipDelay: 200, multiselect: true, navigationButtons: true, keyboard: { enabled: true, bindToWindow: false } },
    nodes: { shape: 'dot', size: 25, font: { size: 13, face: 'Segoe UI, PingFang SC, sans-serif', strokeWidth: 2, strokeColor: '#080a10' }, borderWidth: 2, shadow: { enabled: true, size: 6, x: 2, y: 2 }, margin: 8 },
    edges: { width: 2, smooth: { type: 'curvedCW', roundness: 0.2 }, font: { size: 11, face: 'Segoe UI, PingFang SC, sans-serif', align: 'middle', strokeWidth: 2, strokeColor: '#080a10' }, arrows: { to: { enabled: true, scaleFactor: 0.7 } }, shadow: { enabled: true, size: 3, x: 1, y: 1 } },
  };
  state.network = new vis.Network(ct, { nodes: state.nodes, edges: state.edges }, Object.assign({}, base, { physics: LP.force.physics, layout: LP.force.layout }));
  state.network.on('click', hClick);
  state.network.on('deselectNode', function() { if(!state.addingEdge.active) clrSel(); });
  state.network.on('deselectEdge', function() { if(!state.addingEdge.active) clrSel(); });
  state.network.on('doubleClick', function(p) { if(p.nodes.length) openTab(p.nodes[0]); });
  ct.addEventListener('click', function(e) { if((e.target===ct||e.target.id==='graph-vis')&&!state.addingEdge.active) clrSel(); });
  state.network.once('stabilizationIterationsDone', function() { sm('\u5c31\u7eea'); });
}

// ===== Click Handler =====
function hClick(p) { console.log("[CLICK] hClick() nodes="+(p?p.nodes?p.nodes.length:0:0)+" edges="+(p?p.edges?p.edges.length:0:0));
  if(!p||!state.network) return;
  var nodes = p.nodes||[], edges = p.edges||[];
  if(state.addingEdge.active) {
    if(nodes.length) {
      var id = nodes[0];
      if(state.addingEdge.fromId===null) {
        state.addingEdge.fromId = id; var nd = state.nodes.get(id);
        state.addingEdge.fromLabel = nd ? nd.label : id;
        document.getElementById('edge-from').value = state.addingEdge.fromLabel + ' (' + id + ')';
        sm('\u5df2\u9009\u8d77\u59cb: ' + state.addingEdge.fromLabel);
        state.network.selectNodes([id]);
      } else if(id!==state.addingEdge.fromId) {
        var td = state.nodes.get(id);
        document.getElementById('edge-to').value = (td?td.label:id) + ' (' + id + ')';
        state.network.selectNodes([state.addingEdge.fromId, id]);
        sm('\u786e\u8ba4\u6dfb\u52a0');
      } else sm('\u4e0d\u80fd\u81ea\u8fde');
    }
    return;
  }
  if(nodes.length) showNodePanel(nodes[0]);
  else if(edges.length) showEdgePanel(edges[0]);
  else clrSel();
}

// ===== Layout =====
function applyLayout(name) { console.log("[LAYOUT] applyLayout('"+name+"')");
  if(!state.network) return;
  var p = LP[name]; if(!p) return;
  state.currentLayout = name;
  if(name==='force') {
    state.network.setOptions({ layout: { hierarchical: { enabled: false }, improvedLayout: true, randomSeed: Date.now() }, physics: p.physics });
    state.network.setOptions({ physics: { enabled: true } }); state.network.startSimulation();
  } else {
    // 切换到层级布局前剥离所有节点的 level，避免 vis 内部已缓存 level 导致冲突
    var ids = state.nodes.getIds();
    for(var i=0;i<ids.length;i++) { state.nodes.update({ id: ids[i], level: undefined }); }
    state.network.setOptions({ layout: p.layout, physics: { enabled: false } });
    state.network.storePositions();
  }
  document.getElementById('footer-layout').textContent = '\u5e03\u5c40: ' + p.label;
  sm('\u5df2\u5207\u6362\u5230 ' + p.label);
}

function tidyLayout() { console.log("[LAYOUT] tidyLayout() current="+state.currentLayout);
  var p = LP[state.currentLayout]; if(!p) return;
  sm('\u4f18\u5316\u4e2d...');
  if(state.currentLayout==='force') {
    state.network.setOptions({ layout: { hierarchical: { enabled: false }, improvedLayout: true, randomSeed: Date.now() }, physics: { enabled: true } });
    state.network.startSimulation();
    state.network.once('stabilizationIterationsDone', function() { sm('\u2705 \u5e03\u5c40\u5df2\u4f18\u5316'); });
  } else {
    // 剥离 level 避免 vis 内部缓存冲突
    var ids = state.nodes.getIds();
    for(var i=0;i<ids.length;i++) { state.nodes.update({ id: ids[i], level: undefined }); }
    state.network.setOptions({ layout: p.layout, physics: { enabled: false } }); state.network.redraw();
    sm('\u2705 ' + p.label + ' \u5df2\u6574\u7406');
  }
}

// ===== loadGraphData =====
function ld(d) { console.log("[DATA] ld() nodes="+(d?d.nodes?d.nodes.length:0:0)+" edges="+(d?d.edges?d.edges.length:0:0)); if(!d) { console.warn("[DATA] ld() received null data"); return; }
  if(!state.nodes) { sm("未初始化"); return; }
  var na = (d.nodes||[]).map(function(n) {
    return { id: n.id, label: n.label||'', level: n.level||1, content: n.content||'',
      color: Cc(n.color||'#4A90D9'), size: ns(n.level||1),
      title: tp(n), properties: n.properties||{}, shadow: {enabled:true} };
  });
  var ea = (d.edges||[]).map(function(e) {
    return { id: e.id, from: e.from, to: e.to, label: e.label||'',
      color: Ce(e.color||'#95A5A6'), width: 2, title: tp(e), properties: e.properties||{} };
  });
  state.nodes.clear(); state.edges.clear();
  state.nodes.add(na); state.edges.add(ea);
  st(); eh(na.length===0);
  sm('\u5df2\u52a0\u8f7d ' + na.length + ' \u8282\u70b9, ' + ea.length + ' \u8fb9');
}

async function rf() {
  if(!state.nodes) { sm('初始化未完成，请检查控制台'); return; }
  try { sm('加载中...'); var d = await ca('get_graph'); if(d) ld(d); sm('就绪'); }
  catch(e) { sm('后端连接失败: ' + e.message); }
}

// ===== Node Panel =====
function showNodePanel(id) { console.log("[PANEL] showNodePanel("+id+")");
  if(!state.nodes) return;
  var nd = state.nodes.get(id); if(!nd) return;
  state.selectedType = 'node'; state.selectedId = id;
  hAP();
  document.getElementById('panel-node').classList.remove('hidden');
  var bg = typeof nd.color==='object' ? nd.color.background : (nd.color||'#4A90D9');
  document.getElementById('edit-node-label').value = nd.label||'';
  document.getElementById('edit-node-color').value = bg;
  document.getElementById('node-color-hex').textContent = bg;
  document.getElementById('edit-node-props').value = JSON.stringify(nd.properties||{}, null, 2);
  document.getElementById('edit-node-level').textContent = nd.level||1;
  uLD(nd.level||1);
}

async function saveNode() { console.log("[ACTION] saveNode()");
  var id = state.selectedId; if(!id||state.selectedType!=='node') return;
  var label = document.getElementById('edit-node-label').value.trim()||'\u672a\u547d\u540d';
  var color = document.getElementById('edit-node-color').value;
  var level = parseInt(document.getElementById('edit-node-level').textContent)||1;
  var props = {};
  try { var t = document.getElementById('edit-node-props').value.trim(); if(t) props = JSON.parse(t); }
  catch(e) { sm('JSON\u683c\u5f0f\u9519\u8bef'); return; }
  try {
    sm('\u4fdd\u5b58\u4e2d...');
    await ca('update_node', { node_id: id, label: label, color: color, properties: props, level: level });
    state.nodes.update({ id: id, label: label, level: level, properties: props,
      color: Cc(color), size: ns(level), title: tp({label:label,properties:props}) });
    sm('\u2705 \u8282\u70b9\u5df2\u4fdd\u5b58'); st();
  } catch(e) { sm('\u274c \u5931\u8d25: ' + e.message); }
}

// ===== Edge Panel =====
function showEdgePanel(id) { console.log("[PANEL] showEdgePanel("+id+")");
  var ed = state.edges.get(id); if(!ed) return;
  state.selectedType = 'edge'; state.selectedId = id;
  hAP();
  document.getElementById('panel-edge').classList.remove('hidden');
  var ec = typeof ed.color==='object' ? ed.color.color : (ed.color||'#95A5A6');
  document.getElementById('edit-edge-label').value = ed.label||'';
  document.getElementById('edit-edge-color').value = ec;
  document.getElementById('edge-color-hex').textContent = ec;
  document.getElementById('edit-edge-props').value = JSON.stringify(ed.properties||{}, null, 2);
}

async function saveEdge() { console.log("[ACTION] saveEdge()");
  var id = state.selectedId; if(!id||state.selectedType!=='edge') return;
  var label = document.getElementById('edit-edge-label').value.trim()||'\u5173\u8054';
  var color = document.getElementById('edit-edge-color').value;
  var props = {};
  try { var t = document.getElementById('edit-edge-props').value.trim(); if(t) props = JSON.parse(t); }
  catch(e) { sm('JSON\u683c\u5f0f\u9519\u8bef'); return; }
  try {
    await ca('update_edge', { edge_id: id, label: label, color: color, properties: props });
    state.edges.update({ id: id, label: label, color: Ce(color), title: tp({label:label,properties:props}), properties: props });
    sm('\u2705 \u8fb9\u5df2\u4fdd\u5b58');
  } catch(e) { sm('\u274c \u5931\u8d25: ' + e.message); }
}

// ===== Add Node =====
async function addNode() { console.log("[ACTION] addNode() start");
  if(!state.nodes||!state.network) { sm("图谱未就绪"); return; }
  try {
    var c = NC[Math.floor(Math.random()*NC.length)];
    var r = await ca('add_node', { label: '\u65b0\u8282\u70b9', color: c, level: 1 });
    state.nodes.add({ id: r.id, label: '\u65b0\u8282\u70b9', level: 1,
      color: Cc(c), size: ns(1), title: tp(r), properties: {} });
    eh(false);
    state.network.selectNodes([r.id]);
    showNodePanel(r.id);
    st(); sm('\u2705 \u5df2\u521b\u5efa');
  } catch(e) { sm('\u274c \u5931\u8d25: ' + e.message); }
}

// ===== Edge Mode =====
function startAddEdge() { console.log("[EDGE] startAddEdge()");
  if(!state.network) { sm('图谱未就绪'); return; }
  cancelAddEdge();
  state.addingEdge.active = true; hAP();
  document.getElementById('panel-add-edge').classList.remove('hidden');
  document.getElementById('edge-from').value = '';
  document.getElementById('edge-to').value = '';
  sm('\u8bf7\u70b9\u51fb\u8d77\u59cb\u8282\u70b9');
  document.getElementById('footer-mode').textContent = '\u6a21\u5f0f: \u6dfb\u52a0\u8fb9';
}

async function confirmAddEdge() { console.log("[EDGE] confirmAddEdge()");
  if(!state.addingEdge.fromId) { sm('\u8bf7\u5148\u9009\u8d77\u59cb\u8282\u70b9'); return; }
  var sel = state.network.getSelectedNodes();
  var toId = null;
  for(var i=0;i<sel.length;i++) { if(sel[i]!==state.addingEdge.fromId) { toId=sel[i]; break; } }
  if(!toId) { sm('\u8bf7\u70b9\u51fb\u76ee\u6807\u8282\u70b9'); return; }
  var label = document.getElementById('edge-new-label').value.trim()||'\u5173\u8054';
  var color = document.getElementById('edge-new-color').value;
  try {
    var r = await ca('add_edge', { from: state.addingEdge.fromId, to: toId, label: label, color: color });
    state.edges.add({ id: r.id, from: r.from, to: r.to, label: label, width: 2, color: Ce(color), title: tp({label:label,properties:r.properties||{}}), properties: r.properties||{} });
    st(); sm('\u2705 \u8fb9\u5df2\u6dfb\u52a0');
    cancelAddEdge();
  } catch(e) { sm('\u274c \u5931\u8d25: ' + e.message); }
}

function cancelAddEdge() { console.log("[EDGE] cancelAddEdge()");
  state.addingEdge.active = false; state.addingEdge.fromId = null;
  document.getElementById('panel-add-edge').classList.add('hidden');
  document.getElementById('panel-empty').classList.remove('hidden');
  document.getElementById('edge-from').value = ''; document.getElementById('edge-to').value = '';
  state.network.setSelection({ nodes: [], edges: [] });
  document.getElementById('footer-mode').textContent = '\u6a21\u5f0f: \u6d4f\u89c8';
  clrSel(); sm('\u5df2\u53d6\u6d88');
}

// ===== Delete =====
async function deleteSelected() { console.log("[ACTION] deleteSelected() start");
  if(!state.network) return;
  var sn = state.network.getSelectedNodes(), se = state.network.getSelectedEdges();
  if(!sn.length&&!se.length) { sm('\u8bf7\u5148\u9009\u4e2d'); return; }
  try {
    for(var i=0;i<sn.length;i++) { await ca('delete_node', { node_id: sn[i] }); state.nodes.remove(sn[i]); }
    for(var i=0;i<se.length;i++) { await ca('delete_edge', { edge_id: se[i] }); state.edges.remove(se[i]); }
    sm('\u2705 \u5df2\u5220\u9664 ' + sn.length + ' \u8282\u70b9, ' + se.length + ' \u8fb9');
    clrSel(); st(); eh(state.nodes.length===0);
  } catch(e) { sm('\u274c \u5931\u8d25: ' + e.message); }
}

function clrSel() { console.log("[UI] clrSel()");
  if(!state.network) return;
  state.selectedType = null; state.selectedId = null;
  state.network.setSelection({ nodes: [], edges: [] });
  hAP(); document.getElementById('panel-empty').classList.remove('hidden');
}

// ===== File Operations =====
async function newGraph() { console.log("[FILE] newGraph()");
  try { await ca('new_graph'); state.nodes.clear(); state.edges.clear(); state.currentFilePath = null; clrSel(); st(); eh(true); sm('\u65b0\u5efa\u5b8c\u6210'); }
  catch(e) { sm('\u5931\u8d25: ' + e.message); }
}
async function openFile() { console.log("[FILE] openFile()");
  try { var d = await window.api.openDialog(); if(d.canceled||!d.filePaths||!d.filePaths.length) return; state.currentFilePath = d.filePaths[0]; await rf(); }
  catch(e) { sm('\u5931\u8d25: ' + e.message); }
}
async function saveFile() { console.log("[FILE] saveFile()");
  try { var fp = state.currentFilePath; if(!fp) { var d = await window.api.saveDialog('knowledge-graph.kg'); if(d.canceled||!d.filePath) return; fp = d.filePath; } var r = await ca('save_graph', { filepath: fp }); state.currentFilePath = fp; sm('\u2705 \u5df2\u4fdd\u5b58: ' + r.node_count + ' \u8282\u70b9, ' + r.edge_count + ' \u8fb9'); }
  catch(e) { sm('\u5931\u8d25: ' + e.message); }
}
async function loadSample() { console.log("[FILE] loadSample()");
  if(!state.nodes) { sm('未初始化'); return; }
  try { sm('加载示例...'); var d = await ca('load_sample'); if(d) ld(d); state.currentFilePath = null; }
  catch(e) { sm('\u5931\u8d25: ' + e.message); }
}

// ===== Node Tab Page (Rich Text Editor) =====
function openTab(id) { console.log("[TAB] openTab("+id+")");
  if(!state.nodes) return;
  var nd = state.nodes.get(id); if(!nd) return;
  state.tabNodeId = id;
  document.getElementById('tab-dot-color').style.color = typeof nd.color==='object' ? nd.color.background : (nd.color||'#4DA6FF');
  document.getElementById('tab-node-title').value = nd.label||'';
  document.getElementById('tab-level-badge').textContent = 'Lv.' + (nd.level||1);
  document.getElementById('tab-node-id').textContent = '#' + id;
  var ed = document.getElementById('tab-editor');
  if(nd.content) ed.innerHTML = nd.content;
  else ed.innerHTML = '<h2>' + (nd.label||'') + '</h2><p>\u5728\u8fd9\u91cc\u7f16\u5199\u8be6\u7ec6\u77e5\u8bc6...</p>';
  document.getElementById('node-tab-overlay').classList.remove('hidden');
  setTimeout(function() { ed.focus(); }, 100);
  uWC();
}

function closeTab() { console.log("[TAB] closeTab()");
  document.getElementById('node-tab-overlay').classList.add('hidden');
  state.tabNodeId = null;
}

async function saveTab() { console.log("[TAB] saveTab() id="+state.tabNodeId);
  var id = state.tabNodeId; if(!id) return;
  var label = document.getElementById('tab-node-title').value.trim()||'\u672a\u547d\u540d';
  var content = document.getElementById('tab-editor').innerHTML;
  try {
    await ca('update_node', { node_id: id, label: label, content: content });
    state.nodes.update({ id: id, label: label, content: content, title: tp({label:label,properties:state.nodes.get(id).properties}) });
    document.getElementById('edit-node-label').value = label;
    sm('\u2705 \u6807\u7b7e\u9875\u5df2\u4fdd\u5b58');
  } catch(e) { sm('\u274c \u5931\u8d25: ' + e.message); }
}

function uWC() {
  var ed = document.getElementById('tab-editor');
  var txt = ed.textContent||'';
  document.getElementById('tab-word-count').textContent = '\u5b57\u6570: ' + txt.replace(/\\s/g,'').length;
}

function tabCmd(cmd, val) {
  document.execCommand(cmd, false, val||null);
  document.getElementById('tab-editor').focus();
  uWC();
}

// ===== Tab Toolbar Events =====
document.getElementById('tab-bold').addEventListener('click', function() { tabCmd('bold'); });
document.getElementById('tab-italic').addEventListener('click', function() { tabCmd('italic'); });
document.getElementById('tab-underline').addEventListener('click', function() { tabCmd('underline'); });
document.getElementById('tab-strikethrough').addEventListener('click', function() { tabCmd('strikeThrough'); });
document.getElementById('tab-highlight').addEventListener('click', function() { tabCmd('backColor', '#ffd700'); });
document.getElementById('tab-color').addEventListener('click', function() { tabCmd('foreColor', document.getElementById('tab-color-picker').value); });
document.getElementById('tab-color-picker').addEventListener('input', function(e) { tabCmd('foreColor', e.target.value); });
document.getElementById('tab-align-left').addEventListener('click', function() { tabCmd('justifyLeft'); });
document.getElementById('tab-align-center').addEventListener('click', function() { tabCmd('justifyCenter'); });
document.getElementById('tab-align-right').addEventListener('click', function() { tabCmd('justifyRight'); });
document.getElementById('tab-list').addEventListener('click', function() { tabCmd('insertUnorderedList'); });
document.getElementById('tab-olist').addEventListener('click', function() { tabCmd('insertOrderedList'); });
document.getElementById('tab-font-size').addEventListener('change', function(e) { tabCmd('fontSize', e.target.value); });
document.getElementById('tab-editor').addEventListener('keydown', function(e) { if((e.ctrlKey||e.metaKey)&&e.key==='s') { e.preventDefault(); saveTab(); } setTimeout(uWC, 0); });
document.getElementById('tab-editor').addEventListener('input', uWC);
document.getElementById('tab-save-close').addEventListener('click', function() { saveTab().then(closeTab); });
document.getElementById('node-tab-close').addEventListener('click', closeTab);
document.getElementById('node-tab-backdrop').addEventListener('click', function(e) { if(e.target===document.getElementById('node-tab-backdrop')) closeTab(); });

// ===== Level Up/Down =====
document.getElementById('level-down').addEventListener('click', function() {
  var el = document.getElementById('edit-node-level');
  var lv = Math.max(1, parseInt(el.textContent) - 1);
  el.textContent = lv; uLD(lv);
});
document.getElementById('level-up').addEventListener('click', function() {
  var el = document.getElementById('edit-node-level');
  var lv = Math.min(10, parseInt(el.textContent) + 1);
  el.textContent = lv; uLD(lv);
});

// ===== Color Sync =====
document.getElementById('edit-node-color').addEventListener('input', function(e) { document.getElementById('node-color-hex').textContent = e.target.value; });
document.getElementById('edit-edge-color').addEventListener('input', function(e) { document.getElementById('edge-color-hex').textContent = e.target.value; });
document.getElementById('edge-new-color').addEventListener('input', function(e) { document.getElementById('edge-new-color-hex').textContent = e.target.value; });

// ===== Shortcuts =====
document.addEventListener('keydown', function(e) {
  var tag = e.target.tagName, ctrl = e.ctrlKey||e.metaKey;
  var inInput = tag==='INPUT'||tag==='TEXTAREA'||e.target.contentEditable==='true';
  if(ctrl && e.key==='s') { e.preventDefault(); if(inInput&&document.getElementById('node-tab-overlay').classList.contains('hidden')===false) saveTab(); else saveFile(); return; }
  if(ctrl && e.key==='o') { e.preventDefault(); openFile(); return; }
  if(ctrl && e.key==='n') { e.preventDefault(); newGraph(); return; }
  if(ctrl && e.key==='a' && !inInput) { e.preventDefault(); state.network.selectNodes(state.nodes.getIds()); sm('\u9009\u4e2d '+state.nodes.length+' \u4e2a\u8282\u70b9'); return; }
  if(e.key===' ' && !inInput) {
    e.preventDefault();
    var sel = state.network.getSelectedNodes();
    if(sel.length>=2 && sel[0]!==sel[1]) {
      var fromId = sel[0], toId = sel[1];
      ca('add_edge', { from: fromId, to: toId, label: '\u5173\u8054', color: '#95A5A6' }).then(function(r) {
        state.edges.add({ id: r.id, from: r.from, to: r.to, label: '\u5173\u8054', width: 2, color: Ce('#95A5A6'), title: tp({label:'\u5173\u8054'}), properties: {} });
        st(); sm('\u2705 \u5df2\u8fde\u63a5');
      }).catch(function(e) { sm('\u274c '+e.message); });
    } else sm('\u8bf7\u9009\u4e2d\u4e24\u4e2a\u8282\u70b9');
    return;
  }
  if(!inInput && !ctrl) {
    if(e.key==='a'||e.key==='A') { e.preventDefault(); addNode(); return; }
    if(e.key==='e'||e.key==='E') { e.preventDefault(); startAddEdge(); return; }
    if(e.key==='l'||e.key==='L') { e.preventDefault(); tidyLayout(); return; }
    if(e.key==='Delete'||e.key==='Backspace') { e.preventDefault(); deleteSelected(); return; }
    if(e.key==='Escape') { e.preventDefault(); if(state.addingEdge.active) cancelAddEdge(); else { if(!document.getElementById('node-tab-overlay').classList.contains('hidden')) closeTab(); clrSel(); } return; }
    if(e.key==='?') { e.preventDefault(); document.getElementById('shortcuts-overlay').classList.toggle('hidden'); return; }
    if(e.key==='1') { e.preventDefault(); applyLayout('force'); document.getElementById('layout-select').value='force'; return; }
    if(e.key==='2') { e.preventDefault(); applyLayout('hierarchical'); document.getElementById('layout-select').value='hierarchical'; return; }
    if(e.key==='3') { e.preventDefault(); applyLayout('radial'); document.getElementById('layout-select').value='radial'; return; }
    if(e.key==='Tab') { e.preventDefault(); document.getElementById('search-input').focus(); return; }
  }
  if(!inInput && e.key==='Enter' && state.addingEdge.active) { e.preventDefault(); confirmAddEdge(); }
});

// ===== Shortcuts Overlay =====
var scEl=document.getElementById('shortcuts-close');if(scEl)scEl.addEventListener('click',function(){var so=document.getElementById('shortcuts-overlay');if(so)so.classList.add('hidden');});
document.getElementById('shortcuts-backdrop').addEventListener('click', function(e) { if(e.target===document.getElementById('shortcuts-backdrop')) document.getElementById('shortcuts-overlay').classList.add('hidden'); });
document.getElementById('btn-shortcuts').addEventListener('click', function() { document.getElementById('shortcuts-overlay').classList.toggle('hidden'); });

// ===== Search =====
var searchTimeout = null;
document.getElementById('search-input').addEventListener('input', function(e) {
  clearTimeout(searchTimeout);
  var q = e.target.value.trim();
  if(!q) { state.nodes.forEach(function(n) { state.nodes.update({ id: n.id, hidden: false }); }); return; }
  searchTimeout = setTimeout(async function() {
    try { var r = await ca('search_nodes', { query: q }); var ids = new Set(r.map(function(x) { return x.id; })); state.nodes.forEach(function(n) { state.nodes.update({ id: n.id, hidden: !ids.has(n.id) }); }); sm('\u641c\u7d22: '+r.length+' \u4e2a'); }
    catch(err) { console.error(err); }
  }, 300);
});

// ===== Event Bindings =====
document.getElementById('btn-new').addEventListener('click', newGraph);
document.getElementById('btn-open').addEventListener('click', openFile);
document.getElementById('btn-save').addEventListener('click', saveFile);
document.getElementById('btn-sample').addEventListener('click', loadSample);
document.getElementById('btn-add-node').addEventListener('click', addNode);
document.getElementById('btn-add-edge').addEventListener('click', startAddEdge);
document.getElementById('btn-delete-selected').addEventListener('click', deleteSelected);
document.getElementById('btn-tidy-layout').addEventListener('click', tidyLayout);
document.getElementById('layout-select').addEventListener('change', function(e) { applyLayout(e.target.value); });
document.getElementById('btn-save-node').addEventListener('click', saveNode);
document.getElementById('btn-save-edge').addEventListener('click', saveEdge);
document.getElementById('btn-confirm-edge').addEventListener('click', confirmAddEdge);
document.getElementById('btn-cancel-edge').addEventListener('click', cancelAddEdge);
document.getElementById('btn-open-tab') && document.getElementById('btn-open-tab').addEventListener('click', function() { if(state.selectedId) openTab(state.selectedId); });
document.getElementById('btn-open-node-tab').addEventListener('click', function() { if(state.selectedId) openTab(state.selectedId); });
document.getElementById('btn-open-node-tab2').addEventListener('click', function() { if(state.selectedId) openTab(state.selectedId); });

// ===== Init =====
async function init() { try { initNet(); await rf(); } catch(e) { sm("启动失败: "+e.message); console.error(e); } }
window.addEventListener("error",function(e){console.error("[GLOBAL-ERR] "+e.message+" at "+e.filename+":"+e.lineno);});
init().catch(function(e) { console.error(e); sm('\u542f\u52a8\u5931\u8d25: ' + e.message); });
