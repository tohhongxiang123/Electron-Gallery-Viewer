const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron')
app.allowRendererProcessReuse = false
app.webSecurity = false

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        title: "Gallery Viewer",
        webPreferences: {
            nodeIntegration: true,
            preload: __dirname + '/src/preload.js',
            webSecurity: false
        }
    });

    // and load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format({
        pathname: path.join(__dirname, '/build/index.html'),
        protocol: 'file:',
        slashes: true
    });
    mainWindow.loadURL(startUrl);

    const template = [{
        label: "File",
        submenu: [{
                label: "Open Folder",
                accelerator: "CmdOrCtrl+N",
                click() {
                    openFolder();
                }
            },
            {
                label: "Open File",
                accelerator: "CmdOrCtrl+O",
                click() {
                    openFile();
                }
            },
            {
                type: 'separator'
            },
            {
                role: 'close'
            }
        ]
    }]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    // Open the DevTools.
    if (process.env.ELECTRON_START_URL) mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// open file
// const fs = require('fs')
async function openFile() {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{
            name: 'Images or Videos',
            extensions: ['jpg', 'png', 'jpeg', 'mp4', 'mkv']
        }]
    })

    const file = filePaths[0]
    if (!file) return;

    mainWindow.webContents.send('select-file', file)
}

async function openFolder(initialFolder) {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        filters: [{
            name: 'Images or Videos',
            extensions: ['jpg', 'png', 'jpeg', 'mp4', 'mkv']
        }]
    })

    const folder = filePaths[0]
    if (!folder) return

    mainWindow.webContents.send('select-folder', folder)
}