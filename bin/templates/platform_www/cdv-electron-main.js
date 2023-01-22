/*
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

const fs = require('fs');
const path = require('path');
const { cordova } = require('./package.json');
// Module to control application life, browser window and tray.
const {
    app,
    BrowserWindow,
    protocol,
    ipcMain
} = require('electron');
// Electron settings from .json file.
const cdvElectronSettings = require('./cdv-electron-settings.json');
const reservedScheme = require('./cdv-reserved-scheme.json');

const devTools = cdvElectronSettings.browserWindow.webPreferences.devTools
    ? require('electron-devtools-installer')
    : false;

const scheme = cdvElectronSettings.scheme;
const hostname = cdvElectronSettings.hostname;
const isFileProtocol = scheme === 'file';

/**
 * The base url path.
 * E.g:
 * When scheme is defined as "file" the base path is "file://path-to-the-app-root-directory"
 * When scheme is anything except "file", for example "app", the base path will be "app://localhost"
 *  The hostname "localhost" can be changed but only set when scheme is not "file"
 */
const basePath = (() => isFileProtocol ? `file://${__dirname}` : `${scheme}://${hostname}`)();

if (reservedScheme.includes(scheme)) throw new Error(`The scheme "${scheme}" can not be registered. Please use a non-reserved scheme.`);

if (!isFileProtocol) {
    protocol.registerSchemesAsPrivileged([
        { scheme, privileges: { standard: true, secure: true } }
    ]);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
    // Create the browser window.
    let appIcon;
    if (fs.existsSync(path.join(__dirname, 'img/app.png'))) {
        appIcon = path.join(__dirname, 'img/app.png');
    } else if (fs.existsSync(path.join(__dirname, 'img/icon.png'))) {
        appIcon = path.join(__dirname, 'img/icon.png');
    } else {
        appIcon = path.join(__dirname, 'img/logo.png');
    }

    const browserWindowOpts = Object.assign({}, cdvElectronSettings.browserWindow, { icon: appIcon });
    browserWindowOpts.webPreferences.preload = path.join(app.getAppPath(), 'cdv-electron-preload.js');
    browserWindowOpts.webPreferences.contextIsolation = true;

    mainWindow = new BrowserWindow(browserWindowOpts);

    // Load a local HTML file or a remote URL.
    const cdvUrl = cdvElectronSettings.browserWindowInstance.loadURL.url;
    const loadUrl = cdvUrl.includes('://') ? cdvUrl : `${basePath}/${cdvUrl}`;
    const loadUrlOpts = Object.assign({}, cdvElectronSettings.browserWindowInstance.loadURL.options);

    mainWindow.loadURL(loadUrl, loadUrlOpts);

    // Open the DevTools.
    if (cdvElectronSettings.browserWindow.webPreferences.devTools) {
        mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

function configureProtocol () {
    protocol.registerFileProtocol(scheme, (request, cb) => {
        const url = request.url.substr(basePath.length + 1);
        cb({ path: path.normalize(path.join(__dirname, url)) }); // eslint-disable-line node/no-callback-literal
    });

    protocol.interceptFileProtocol('file', (_, cb) => { cb(null); });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    if (!isFileProtocol) {
        configureProtocol();
    }

    if (devTools && cdvElectronSettings.devToolsExtension) {
        const extensions = cdvElectronSettings.devToolsExtension.map(id => devTools[id] || id);
        devTools.default(extensions) // default = install extension
            .then((name) => console.log(`Added Extension:  ${name}`))
            .catch((err) => console.log('An error occurred: ', err));
    }

    createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        if (!isFileProtocol) {
            configureProtocol();
        }

        createWindow();
    }
});

ipcMain.handle('cdv-plugin-exec', async (_, serviceName, action, args, callbackId) => {
    // This function should never return a rejected promise or throw an exception, as otherwise ipcRenderer callback will convert the parameter to a string incapsulated in an Error. See https://github.com/electron/electron/issues/24427

    const { CallbackContext, PluginResult } = require('./CallbackContext.js');
    const callbackContext = new CallbackContext(callbackId, mainWindow);

    // this condition should never be met, exec.js already tests for it.
    if (!(cordova && cordova.services && cordova.services[serviceName])) {
        const message = `NODE: Invalid Service. Service '${serviceName}' does not have an electron implementation.`;
        callbackContext.error(new PluginResult(PluginResult.ERROR | PluginResult.ERROR_UNKNOWN_SERVICE, message));
        return;
    }

    const plugin = require(cordova.services[serviceName]);

    // API3 backwards compatible plugin call handling
    const packageConfig = require(cordova.services[serviceName] + '/package.json');
    if (packageConfig.cordova.API3 !== false) {
        console.error('WARNING! Package ' + cordova.services[serviceName] + ' is using a deprecated API. Migrate to cordova-electron API 4.x ASAP. This API will be break in the next major version.');
        try {
            await plugin[action](args);
        } catch (exception) {
            const message = "NODE: Exception while invoking service action '" + serviceName + '.' + action + "'\r\n" + exception;
            // print error to terminal
            console.error(message, exception);
            // trigger node side error callback
            callbackContext.error(new PluginResult(PluginResult.ERROR | PluginResult.ERROR_INVOCATION_EXCEPTION_NODE, { message, exception }));
        }
        return;
    }

    // API 4.x handling
    try {
        const result = await plugin(action, args, callbackContext);
        if (result === true) {
            // successful invocation
        } else if (result === false) {
            const message = `NODE: Invalid action. Service '${serviceName}' does not have an electron implementation for action '${action}'.`;
            callbackContext.error(new PluginResult(PluginResult.ERROR | PluginResult.ERROR_UNKNOWN_ACTION, message));
        } else {
            const message = 'NODE: Unexpected plugin exec result' + result;
            callbackContext.error(new PluginResult(PluginResult.ERROR | PluginResult.ERROR_UNEXPECTED_RESULT, message));
        }
    } catch (exception) {
        const message = "NODE: Exception while invoking service action '" + serviceName + '.' + action + "'\r\n" + exception;
        // print error to terminal
        console.error(message, exception);
        // trigger node side error callback
        callbackContext.error(new PluginResult(PluginResult.ERROR | PluginResult.ERROR_INVOCATION_EXCEPTION_NODE, { message, exception }));
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
