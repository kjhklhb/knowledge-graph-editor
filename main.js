const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-application-cache');
var ud = path.join(app.getPath('appData'), 'knowledge-graph-editor');
try { if (!fs.existsSync(ud)) fs.mkdirSync(ud, { recursive: true }); } catch (e) {}
app.setPath('userData', ud);

// ========== 日志：所有消息同时进缓冲区和终端 ==========
var DEBUG_DIR = path.join(__dirname, 'debug');
var LOG_BUF = [];
var MAX_LOG = 10000;
var SESSION_START = new Date().toISOString().replace(/[:.]/g, '-');

// 原始 console 方法（直接写终端，不进缓冲区）
var _RAW_LOG = console.log;
var _RAW_ERR = console.error;

function ensureDir() { try { if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true }); } catch (e) {} }

// log() 往缓冲区写 + 也往终端写
function log(level, tag, msg) {
  var ts = new Date().toISOString();
  var line = '[' + ts + '] [' + level + '] [' + tag + '] ' + msg;
  LOG_BUF.push(line);
  if (LOG_BUF.length > MAX_LOG) LOG_BUF.shift();
  if (level === 'ERROR') _RAW_ERR(line); else _RAW_LOG(line);
}

function writeLog() {
  ensureDir();
  var ts = new Date().toISOString().replace(/[:.]/g, '-');
  var fp = path.join(DEBUG_DIR, 'session-' + ts + '.log');
  var hdr = '# Session Log\n# Start: ' + SESSION_START + '\n# End: ' + new Date().toISOString() + '\n# Platform: ' + process.platform + ' ' + process.arch + '\n# Electron: ' + process.versions.electron + '\n# Node: ' + process.versions.node + '\n# Lines: ' + LOG_BUF.length + '\n#\n';
  try { fs.writeFileSync(fp, hdr + LOG_BUF.join('\n'), 'utf-8'); _RAW_LOG('[LOG] Written: ' + fp); } catch (e) { _RAW_ERR('[LOG] Write fail: ' + e.message); }
}

// ========== Python 管理 ==========
var pyProcess = null;
var pendingReqs = new Map();
var reqId = 0;
var outBuf = '';

function startPython() {
  var py = process.platform === 'win32' ? 'python' : 'python3';
  var sp = path.join(__dirname, 'backend', 'worker.py');
  log('INFO', 'PY', 'Start: ' + py + ' ' + sp);

  pyProcess = spawn(py, [sp], { stdio: ['pipe', 'pipe', 'pipe'], cwd: path.join(__dirname, 'backend') });

  pyProcess.stdout.on('data', function(d) {
    var raw = d.toString();
    outBuf += raw;
    var lines = outBuf.split('\n');
    outBuf = lines.pop();
    for (var i = 0; i < lines.length; i++) {
      var t = lines[i].trim();
      if (!t) continue;
      try {
        var m = JSON.parse(t);
        var id = m.id;
        var p = pendingReqs.get(id);
        if (p) {
          pendingReqs.delete(id);
          clearTimeout(p.timer);
          if (m.error) { log('ERROR', 'PY-ERR', 'id=' + id + ' ' + m.error); p.rej(new Error(m.error)); }
          else { log('INFO', 'PY-OK', 'id=' + id + ' ' + JSON.stringify(m.result).substring(0, 200)); p.res(m.result); }
        } else { log('WARN', 'PY-ORPHAN', 'id=' + id); }
      } catch (e) { log('ERROR', 'PY-PARSE', t.substring(0, 100) + ' | ' + e.message); }
    }
  });

  pyProcess.stderr.on('data', function(d) { log('ERROR', 'PY-STDERR', d.toString().trim()); });
  pyProcess.on('error', function(e) { log('ERROR', 'PY', 'Spawn: ' + e.message); });
  pyProcess.on('exit', function(c) { log('INFO', 'PY', 'Exit code=' + c); if (c !== 0 && c !== null) { log('INFO', 'PY', 'Restart...'); startPython(); } });
}

function callPy(action, params) {
  if (!params) params = {};
  return new Promise(function(resolve, reject) {
    var id = ++reqId;
    var p = { id: id, action: action };
    for (var k in params) { if (Object.prototype.hasOwnProperty.call(params, k)) p[k] = params[k]; }
    var json = JSON.stringify(p) + '\n';
    log('INFO', 'PY-SEND', 'id=' + id + ' action=' + action + ' ' + JSON.stringify(params).substring(0, 200));
    var timer = setTimeout(function() {
      pendingReqs.delete(id);
      log('ERROR', 'PY-TIMEOUT', 'id=' + id + ' ' + action);
      reject(new Error('Timeout: ' + action));
    }, 30000);
    pendingReqs.set(id, { res: resolve, rej: reject, timer: timer });
    try {
      if (!pyProcess || !pyProcess.stdin) { clearTimeout(timer); pendingReqs.delete(id); reject(new Error('Python not running')); return; }
      pyProcess.stdin.write(json);
    } catch (e) { clearTimeout(timer); pendingReqs.delete(id); reject(e); }
  });
}

// ========== IPC ==========
ipcMain.handle('call-python', async function(evt, action, params) {
  var ps = 'undefined';
  try { if (params) ps = JSON.stringify(params).substring(0, 500); } catch(e) { ps = '[stringify-error]'; }
  log('INFO', 'IPC-REQ', 'action=' + action + ' params=' + ps);
  try { var r = await callPy(action, params); log('INFO', 'IPC-OK', 'action=' + action); return { success: true, data: r }; }
  catch (e) { log('ERROR', 'IPC-FAIL', 'action=' + action + ' ' + e.message); return { success: false, error: e.message }; }
});

ipcMain.handle('save-dialog', async function(evt, name) {
  try { return await dialog.showSaveDialog({ title: '\u4fdd\u5b58\u77e5\u8bc6\u56fe\u8c31', defaultPath: name || 'knowledge-graph.kg', filters: [{ name: '\u77e5\u8bc6\u56fe\u8c31\u6587\u4ef6 (.kg)', extensions: ['kg'] }, { name: 'JSON', extensions: ['json'] }] }); }
  catch(e) { log('ERROR', 'DIALOG', 'save: ' + e.message); return { canceled: true }; }
});

ipcMain.handle('open-dialog', async function() {
  try { return await dialog.showOpenDialog({ title: '\u6253\u5f00\u77e5\u8bc6\u56fe\u8c31', filters: [{ name: '\u77e5\u8bc6\u56fe\u8c31\u6587\u4ef6 (.kg)', extensions: ['kg'] }, { name: 'JSON', extensions: ['json'] }, { name: '\u5168\u90e8', extensions: ['*'] }], properties: ['openFile'] }); }
  catch(e) { log('ERROR', 'DIALOG', 'open: ' + e.message); return { canceled: true, filePaths: [] }; }
});

ipcMain.handle('frontend-log', async function(evt, level, msg) {
  log(level, 'FE', msg);
});

// ========== 捕获渲染进程控制台输出 ==========
app.on('web-contents-created', function(evt, wc) {
  wc.on('console-message', function(evt, level, msg, line, src) {
    var lv = level === 2 ? 'ERROR' : (level === 1 ? 'WARN' : 'INFO');
    log(lv, 'RENDERER', msg + ' (' + path.basename(src) + ':' + line + ')');
  });
  wc.on('render-process-gone', function(evt, details) {
    log('ERROR', 'RENDERER', 'Process gone! reason=' + details.reason);
  });
  wc.on('unresponsive', function() { log('ERROR', 'RENDERER', 'Unresponsive!'); });
});

// ========== 窗口 ==========
function createWindow() {
  log('INFO', 'WIN', 'Creating...');
  var win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1000, minHeight: 700,
    title: '\u77e5\u8bc6\u56fe\u8c31\u7f16\u8f91\u5668',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile(path.join(__dirname, 'frontend', 'index.html'));
  win.on('closed', function() { log('INFO', 'WIN', 'Closed'); });
}

app.whenReady().then(function() {
  log('INFO', 'APP', 'Starting...');
  ensureDir();
  startPython();
  createWindow();
  app.on('activate', function() { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('before-quit', function() { log('INFO', 'APP', 'Quitting...'); writeLog(); });

app.on('window-all-closed', function() {
  if (pyProcess) {
    try { pyProcess.stdin.write(JSON.stringify({ action: 'shutdown' }) + '\n'); } catch (e) {}
    setTimeout(function() { if (pyProcess) { pyProcess.kill(); pyProcess = null; } }, 1000);
  }
  if (process.platform !== 'darwin') app.quit();
});
