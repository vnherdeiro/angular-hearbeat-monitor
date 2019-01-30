const { app, BrowserWindow } = require('electron');
let win;
function createWindow () {
win = new BrowserWindow({ width: 1440, height: 900 });
// win.maximize();
win.loadFile('./dist/hearbeat-monitor/index.html');
win.on('closed', () => {
   win = null
  })
};
app.on('ready', createWindow);
app.on('activate', () => {
if (win === null) {       createWindow()     }
});
