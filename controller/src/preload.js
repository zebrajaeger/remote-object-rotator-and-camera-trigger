const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  start: (imageCount, focusTime, triggerTime) => ipcRenderer.send('start',
    imageCount, focusTime, triggerTime),
  stop: () => ipcRenderer.send('stop'),
  setSettings: (host, stepsPerRevolution, imageCount, focusTime,
    triggerTime) => ipcRenderer.send('setSettings', host, stepsPerRevolution,
    imageCount, focusTime, triggerTime),
  getSettings: () => ipcRenderer.send('getSettings'),
  status: (callback) => ipcRenderer.on('status', callback),
  settings: (callback) => ipcRenderer.on('settings', callback),
})
