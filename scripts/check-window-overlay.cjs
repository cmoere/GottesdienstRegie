const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false, width: 410, height: 700,
    titleBarStyle: 'hidden',
    titleBarOverlay: process.platform === 'win32'
      ? { color: '#282832', symbolColor: '#ffffff', height: 28 } : false,
    resizable: false, maximizable: false,
  });
  try {
    win.setMinimumSize(960, 620);
    win.setResizable(true);
    win.setMaximizable(true);
    win.setBounds({ width: 1200, height: 800 });
    if (process.platform === 'win32') {
      win.setTitleBarOverlay({ color: '#282832', symbolColor: '#ffffff', height: 28 });
    }
    if (win.getBounds().width !== 1200) throw new Error('Workspace width was not restored');
    console.log('PASS: loading window transitions to workspace without overlay exception');
    win.destroy();
    app.exit(0);
  } catch (error) {
    console.error(error);
    win.destroy();
    app.exit(1);
  }
});
