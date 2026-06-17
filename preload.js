const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 调用 Python 后端
  call: (action, params) => ipcRenderer.invoke('call-python', action, params),

  // 文件对话框
  saveDialog: (defaultName) => ipcRenderer.invoke('save-dialog', defaultName),
  openDialog: () => ipcRenderer.invoke('open-dialog'),

  // 前端日志发送到主进程
  log: (level, msg) => ipcRenderer.invoke('frontend-log', level, msg),
});
