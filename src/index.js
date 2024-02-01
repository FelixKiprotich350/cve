const { app, BrowserWindow,Menu,ipcMain,dialog } =require('electron'); 
const path = require('path');
const fs = require('fs');
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

let win;
var metawindow = null;
const currdirectory = process.cwd().toString();

const createWindow = () => {
  console.log(__dirname)
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.maximize();
  win.loadFile('src/main.html');

  const template = [
    {
      label: 'File',
      submenu: [
        {
          role: 'forceReload'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    },
    {
      label: 'Settings',
      click: () => {
        return OpenSettings();
      }
    },
    {
      label: 'About'
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  win.openDevTools();
  win.on('close', () => {
    win = null;
    app.quit();
  })
};


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


ipcMain.handle('showMessageBox', async (event, arg) => {
  const { dialog } = require('electron')
  const options = {
    type: "info",
    buttons: ["Okay"],
    title: "Message Box!",
    message: arg
  }

  var parent_window = BrowserWindow.getFocusedWindow();
  await dialog.showMessageBox(parent_window, options)
});

ipcMain.handle('opensettings', async (event, arg1) => {
  return await OpenSettings();
});

ipcMain.handle("closefocusedwindow", async () => {
  BrowserWindow.getFocusedWindow().close();
})

ipcMain.handle("savesettings", async (event, arg) => {
  var res = savesettings(arg); 
  return res;

})

ipcMain.handle("readvariables", async (event) => {
  try {
    var res =await readsettings();  
  return res;
  } catch (error) {
    return null
  }

})

//////////
//functions

async function OpenSettings() {
  try {

    // Create a new BrowserWindow instance
    metawindow = new BrowserWindow({
      width: 500,
      height: 280,
      parent: win,
      resizable: false,
      minimizable: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
      }
    });

    metawindow.loadFile('src/SettingsPage.html');
    ///metawindow.openDevTools();
    metawindow.setMenu(null);
    metawindow.show();
    metawindow.on('close', async () => {

    })
    metawindow.webContents.on('dom-ready', () => {
      var res = readsettings().then((data => {

        metawindow.webContents.send('sendsettings', data)

      }));

    })

  }
  catch (error) {
    console.log(error);
  }
}

async function readsettings() {
  try {
    var setpath = path.join(currdirectory, 'gitinfo.txt')
    const content = await fs.promises.readFile(setpath, { encoding: 'utf-8' })
    return content;
  } catch (error) {
    console.error('Error reading file:', error.message);
    return null
  }
}

function savesettings(content) {
  try {
    var setpath = path.join(currdirectory, 'gitinfo.txt')
    fs.writeFile(setpath, content, 'utf-8', (err) => {
      if (err) {
        throw err;
      } else {
        console.log('File created successfully!');
      }
    });
    return true;
  }
  catch (err) {
    return false;
  }
}