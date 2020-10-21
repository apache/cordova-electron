const { contextBridge, ipcRenderer } = require('electron');
const { cordova } = require('./package.json');

contextBridge.exposeInMainWorld('_cdvElectronIpc', {
  exec: (success, error, serviceName, action, args) => {
    return ipcRenderer.invoke('cdv-plugin-exec', serviceName, action, args)
      .then(
        success,
        error
      );
  },

  hasService: (serviceName) => cordova
    && cordova.services
    && cordova.services[serviceName]
});
