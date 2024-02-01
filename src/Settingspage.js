const { ipcRenderer } = require('electron')


document.addEventListener('DOMContentLoaded', () => {

    try {

         readsettings();

        document.getElementById("btnsave").addEventListener('click', async event => {

            await SaveSettings();
        })
        document.getElementById("btnclose").addEventListener('click', async event => {
            ipcRenderer.invoke("closefocusedwindow")
        })

    }
    catch (err) {
        alert(err.message);
    }
});
 
async function readsettings() {
    try {

        ipcRenderer.on('sendsettings', async (event, value) => { 
            const parameters=value.split(',');
            document.getElementById("git_username").value= parameters[0]
            document.getElementById("git_reponame").value = parameters[1]
            document.getElementById("git_dbfilepath").value = parameters[2]
             
        })
    } catch (error) {
        alert(error);
    }
}

async function SaveSettings() {
    try {
       
        var user = document.getElementById('git_username').value.toString()
        var repo = document.getElementById('git_reponame').value.toString()
        var fpath = document.getElementById('git_dbfilepath').value.toString()
        const content = user + "," + repo + "," + fpath;
        console.log(content)
        await ipcRenderer.invoke("savesettings", content).then((res) => {
             if(res){
                ipcRenderer.invoke('showMessageBox', "The Settings has been Saved  Successfully!")
             }else{
                ipcRenderer.invoke('showMessageBox', "Failed to Update The settings . Try Again!")
             }
        })
    }
    catch (err) {
        ipcRenderer.invoke('showMessageBox', err.message)
    }
}