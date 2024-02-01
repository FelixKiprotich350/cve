const { ipcRenderer, electron, ipcMain } = require('electron')
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); 



// Replace these values with your GitHub repository information
var owner = 'test';
var repo = 'test';
var filePath = 'test.db';
const localFilePath = path.join(process.cwd().toString(), 'src/LatestUpdateCve.db');
const userAgent = 'CVEsearchtool';
console.log(localFilePath)
// GitHub API endpoint to get the contents of a file
var apiUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;

document.addEventListener('readystatechange', (event) => {
   if (document.readyState.toString().toLowerCase() == "complete") {
      try {         
         //search button
         document.getElementById('searchButton').addEventListener('click', function () {

            const searchInput = document.getElementById('input_searchbox').value.toLowerCase();
            LoadDbData()
               .then(items => { 
                  // Process the array of items
                 let currentItemList = items.filter(item => item.CVEs.toLowerCase().includes(searchInput)); 
                  displayItemList(currentItemList);
               })
               .catch(error => {
                  // Handle any errors
                  console.error('Error:', error.message);
               });
         });
         document.getElementById('updateButton').addEventListener('click', function () {
            downloadFile();
         });
      }
      catch (err) {
         ipcRenderer.invoke("showMessageBox", err.message)
      }
   }
   else {
      //alert("not ready");
   }
});

// Function to download the file
async function downloadFile() {
   try {
      await ipcRenderer.invoke("readvariables").then((res) => {

         if (res) {
            owner = res.split(',')[0];
            repo = res.split(',')[1];
            filePath = res.split(',')[2]; 
            apiUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
             
         } else {
            ipcRenderer.invoke('showMessageBox', "Failed to read The settings . Try Again!")
            return;
         }
      })
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      // Check if the response has data
      if (response.data) {
         // Convert ArrayBuffer to Buffer
         const bufferData = Buffer.from(response.data);
         await fs.writeFile(localFilePath, bufferData, (err) => {
            if (err) {
               ipcRenderer.invoke("showMessageBox", 'Error Occurred' + err.message)
            }
            else {
               ipcRenderer.invoke("showMessageBox", 'File Dowloaded Successfully.')
            }
         })

      } else {
         ipcRenderer.invoke("showMessageBox", 'Error Caught: The data is null')
      }
   } catch (error) {
      ipcRenderer.invoke("showMessageBox", 'Error Caught: ' + error.message)
   }
}

async function LoadDbData() {
   try {
      const db = new sqlite3.Database(localFilePath);
      const query = 'SELECT * FROM db_upwork';
      // Execute the query using a Promise
      const rows = await new Promise((resolve, reject) => {
         db.all(query, [], (err, rows) => {
            if (err) {
               reject(err);
            } else {
               resolve(rows);
            }
         });
      });
      // Close the database connection when done
      db.close();

      // Return the array of items
      return rows;
   } catch (err) {
      ipcRenderer.invoke("showMessageBox", 'Error Caught: ' + err.message)
      throw err;
   }
}

function displayItemList(itemList) {
   const contentDiv = document.getElementById('contentdiv');
   contentDiv.innerHTML = "";
   const columns = ["URL", "provider", "summary", "dt"]
   // Create divs dynamically
   itemList.forEach(data => {
      const roundedDiv = document.createElement('div');
      roundedDiv.classList.add('rounded-div');

      Object.entries(data).forEach(([key, value]) => {
         if (!columns.includes(key)) {
            return;
         }
         const row = document.createElement('div');
         row.classList.add('row');

         const strong = document.createElement('strong');
         strong.textContent = `${key}:`;

         const content = key === 'URL'
            ? `<a href="${value}" class="url-link" onclick="openLink('${value}'); return false;">${value}</a>` // Open link using default browser
            : value;


         row.innerHTML = `${strong.outerHTML} ${content}`;
         roundedDiv.appendChild(row);
      });

      contentDiv.appendChild(roundedDiv);
   });

}


function openLink(url) {
   const { shell } = require('electron');
   shell.openExternal(url);


}
