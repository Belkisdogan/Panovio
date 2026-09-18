const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: "Panovio",
    icon: path.join(__dirname, "build", "icon.ico"),
    autoHideMenuBar: true,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  let frontendPath;

  if (app.isPackaged) {
    frontendPath = path.join(
      process.resourcesPath,
      "frontend",
      "index.html"
    );
  } else {
    frontendPath = path.join(
      __dirname,
      "..",
      "backend",
      "frontend",
      "dist",
      "index.html"
    );
  }

  mainWindow.loadFile(frontendPath);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});