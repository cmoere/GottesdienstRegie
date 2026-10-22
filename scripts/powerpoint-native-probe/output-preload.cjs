// Transfer only the dedicated Main-created frame/ACK port, never a Node/IPC API.
const {ipcRenderer} = require('electron');
const loaded = new Promise(resolve => {
  if (document.readyState === 'complete') resolve(); else addEventListener('load', resolve, {once: true});
});
ipcRenderer.once('native-probe:port', async event => {
  await loaded;
  if (event.ports.length !== 1) {for (const port of event.ports) port.close(); return;}
  window.postMessage('native-probe:frame-port', '*', event.ports);
});
