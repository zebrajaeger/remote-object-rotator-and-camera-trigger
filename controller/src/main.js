// Modules to control application life and create native browser window
const {ipcMain, app, shell, BrowserWindow} = require('electron')
const path = require('path')
const {electronApp, optimizer} = require('@electron-toolkit/utils')
const storage = require('electron-json-storage');

const {Rotator} = require('./rotator');

try {
  require('electron-reloader')(module)
} catch (_) {
  // ignore
}

let mainWindow = undefined;

function createWindow() {
  // Create the browser window.
  const w = new BrowserWindow({
    width: 323,
    height: 415,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux'
      ? {
        icon: path.join(__dirname, '../resources/icon.png')
      }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  })

  w.on('ready-to-show', () => {
    w.show()
  })

  w.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return {action: 'deny'}
  })

  // and load the index.html of the app.
  w.loadFile(path.join(__dirname, 'index.html'))

  return w;
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow = createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })

  ipcMain.on('start',
    (event, imageCount, focusTime, triggerTime, delayAfterShot) => {
      // console.log('start', {imageCount, focusTime, triggerTime})
      start(imageCount, focusTime, triggerTime, delayAfterShot).then()
    })

  ipcMain.on('stop', (event) => {
    // console.log('stop')
    stop()
  })

  ipcMain.on('setSettings',
    (event, host, spr, imageCount, focusTime, triggerTime, delayAfterShot) => {
      console.log('setSettings', host, spr, imageCount, focusTime, triggerTime,
        delayAfterShot)

      rotator.host = host;
      status.stepsPerRevolution = spr;
      status.amount = imageCount;
      status.focusTime = focusTime;
      status.triggerTime = triggerTime;
      status.delayAfterShot = delayAfterShot;

      config.host = host;
      config.spr = spr;
      config.imageCount = imageCount;
      config.focusTime = focusTime;
      config.triggerTime = triggerTime;
      config.delayAfterShot = delayAfterShot;

      storage.set('rotator', config);
      sendSettings();
    })

  ipcMain.on('getSettings', (event) => {
    console.log('getSettings')
    sendSettings();
  })

  sendSettings();
})

let config = storage.getSync('rotator');
config.host = config.host || '';
config.spr = config.spr || '200';
config.imageCount = config.imageCount || 10;
config.focusTime = config.focusTime || 500;
config.triggerTime = config.triggerTime || 500;
config.delayAfterShot = config.delayAfterShot || 500;
console.log('Config', config);

const STATE = {
  'SHOOTING': 'SHOOTING',
  'MOVING': 'MOVING',
  'DELAY': 'DELAY',
  'REWINDING': 'REWINDING',
  'DONE': 'DONE',
  'STOPPING': 'STOPPING',
}
const status = {
  running: false,
  index: 0,
  amount: config.imageCount,
  state: STATE.DONE,
  focusTime: config.focusTime,
  triggerTime: config.triggerTime,
  delayAfterShot: config.delayAfterShot,
  pos: 0,
  stepsPerRevolution: config.spr
}

console.log('storage', storage.getDataPath());
const rotator = new Rotator(config.host);

async function start(imageCount, focusTime, triggerTime, delayAfterShot) {
  if (status.state !== STATE.DONE) {
    console.log('already running')
    return;
  }
  console.log('start', {imageCount, focusTime, triggerTime, delayAfterShot})
  status.amount = imageCount;
  status.index = 0;
  status.focusTime = focusTime;
  status.triggerTime = triggerTime;
  status.delayAfterShot = delayAfterShot;
  status.pos = 0

  for (status.index = 0; status.index < status.amount; ++status.index) {

    // move
    if (status.state === STATE.STOPPING) {
      break;
    }
    sendState(STATE.MOVING);
    const x = (status.index * status.stepsPerRevolution)
      / status.amount;
    console.log('MOVE', x)
    status.pos = await rotator.moveAndWait(x - status.pos);

    // Shot
    if (status.state === STATE.STOPPING) {
      break;
    }
    sendState(STATE.SHOOTING);
    await rotator.shot(status.focusTime, status.triggerTime);

    // Delay
    if (status.state === STATE.STOPPING) {
      break;
    }
    if (status.delayAfterShot > 0) {
      sendState(STATE.DELAY);
      await delay(status.delayAfterShot)
    }
  }

  // go back
  sendState(STATE.REWINDING)
  console.log('REWIND', -status.pos)
  await rotator.moveAndWait(-status.pos);

  sendState(STATE.DONE)
}

function stop() {
  console.log('stop...')
  if (status.state !== STATE.DONE) {
    console.log('...set')
    sendState(STATE.STOPPING);
  } else {
    console.log('...rejected')
  }
}

function sendState(newState) {
  if (STATE.hasOwnProperty(newState)) {
    status.state = newState;
  }
  console.log('status',
    {state: status.state, index: status.index, pos: status.pos,})
  mainWindow.webContents.send('status', status)
}

function sendSettings() {
  mainWindow.webContents.send('settings', rotator.host,
    status.stepsPerRevolution, status.amount, status.focusTime,
    status.triggerTime, status.delayAfterShot)
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

