const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI',{ 
  OpenSettings:(trackpath)=>ipcRenderer.invoke('opensettings',trackpath), 
})
 
