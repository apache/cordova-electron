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

class Sample {
    testProcess(args, callbackContext) {
        const process = require('process')
        callbackContext.success(process.cwd());
    }
    testMany(args, callbackContext) {
        let i = 0;
        const PluginResult = callbackContext.PluginResult;
        const interval = setInterval(() => {
            if (i++ < 3) {
                const result = new PluginResult(PluginResult.STATUS_OK, i);
                result.setKeepCallback(true);
                callbackContext.sendPluginResult(result);
                return;
            }
            callbackContext.success('ELECTRON: last many. This will arrive')
            callbackContext.success('ELECTRON: > last many. This will not')
            clearInterval(interval)
        }, 1000);
    }
    testError(args, callbackContext) {
        const PluginResult = callbackContext.PluginResult;
        let result;
        for (let i = 0; i < 3; i++) {
            result = new PluginResult(PluginResult.STATUS_ERROR, "ELECTRON: multiple errors: " + i);
            result.setKeepCallback(true)
            callbackContext.sendPluginResult(result)
        }
        callbackContext.error('ELECTRON: last error. This will arrive')
        callbackContext.error('ELECTRON: > last error. This will not')
    }
    testEchoElectron(args, callbackContext) {
        const message = 'ELECTRON: echo1 is ' + args[1]
        console.log(message)
        callbackContext.success(message);
    }
    testException(args, callbackContext) {
        throw new Error('Exception in sample plugin')
    }
}

module.exports = function (action, args, callbackContext) {
    const sample = new Sample();
    if (!sample[action]) {
        return false;
    }
    console.log('ELECTRON/PLUGIN Sample: dispatching service action ' + action + '(' + args + ')')
    sample[action](args, callbackContext)
    return true;
}

// module.exports = {
//     testEchoElectron: function() {
//         console.log('ECHO ELECTRON', arguments)
//     }
// }