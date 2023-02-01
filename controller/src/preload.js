const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  start: (imageCount, focusTime, triggerTime, das) => ipcRenderer.send('start',
    imageCount, focusTime, triggerTime,das),
  stop: () => ipcRenderer.send('stop'),
  setSettings: (host, stepsPerRevolution, imageCount, focusTime,
    triggerTime, das) => ipcRenderer.send('setSettings', host, stepsPerRevolution,
    imageCount, focusTime, triggerTime, das),
  manualMove: (angel) => ipcRenderer.send('manual-move', angel),
  getSettings: () => ipcRenderer.send('getSettings'),

  status: (callback) => ipcRenderer.on('status', callback),
  settings: (callback) => ipcRenderer.on('settings', callback),
  isMoving: (callback) => ipcRenderer.on('is-moving', callback),
})
