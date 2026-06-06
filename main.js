const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,

        icon: path.join(__dirname, "icon.png"),

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadURL(
        "http://localhost:3000"
    );
}

app.whenReady().then(() => {
    createWindow();
});