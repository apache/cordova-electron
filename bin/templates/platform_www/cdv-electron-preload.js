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

const { contextBridge, ipcRenderer } = require('electron');
const { cordova } = require('./package.json');

const { PluginResult } = require('./CallbackContext.js');

contextBridge.exposeInMainWorld('_cdvElectronIpc', {
    exec: async (success, error, serviceName, action, callbackId, args) => {
        ipcRenderer.on(callbackId, (event, result) => {
            if (result.status === PluginResult.STATUS_OK) {
                success(result.data);
            } else if (result.status === PluginResult.STATUS_ERROR) {
                error(result.data);
            }

            if (!result.keepCallback) { ipcRenderer.removeAllListeners(callbackId); }
        });
        try {
            await ipcRenderer.invoke('cdv-plugin-exec', serviceName, action, args, callbackId);
        } catch (exception) {
            const message = "CHROME: Exception while invoking service action '" + serviceName + '.' + action + "'";
            console.error(message, exception);
            error({ message, exception });
        }
    },

    hasService: (serviceName) => cordova &&
        cordova.services &&
        cordova.services[serviceName]
});
