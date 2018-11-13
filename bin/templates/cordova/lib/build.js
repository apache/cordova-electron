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

/**
* run
*   Creates a zip file int platform/build folder
*/

const fs = require('fs-extra');
const path = require('path');

const builder = require('electron-builder');
// const { Platform, createTargets, DIR_TARGET } = require('electron-builder');
// const { ConfigParser, xmlHelpers } = require('cordova-common');

function deepMerge (mergeTo, mergeWith) {
    for (const property in mergeWith) {
        if (Object.prototype.toString.call(mergeWith[property]) === '[object Object]') {
            mergeTo[property] = deepMerge((mergeTo[property] || {}), mergeWith[property]);
        } else if (Object.prototype.toString.call(mergeWith[property]) === '[object Array]') {
            mergeTo[property] = [].concat((mergeTo[property] || []), mergeWith[property]);
        } else {
            mergeTo[property] = mergeWith[property];
        }
    }

    return mergeTo;
}

module.exports.run = (buildOptions, api) => {
    return require('./check_reqs')
        .run()
        .then(() => {
            // const isDevelopment = false;
            // const config = new ConfigParser(api.locations.configXml);

            const baseConfig = require(path.resolve(__dirname, './build/base.json'));
            let platformConfig;

            // first load the build configs and format config if present.
            if (buildOptions && buildOptions.buildConfig && fs.existsSync(buildOptions.buildConfig)) {
                // Load build configuration JSON file
                // Check for electron platform
                // Then each node under electron represents the targeting platform.
                //  -> Compile Platform Configs
            }

            // Skip defaults if platform config exists from user defined platform.
            if (!platformConfig) {
                switch (process.platform) {
                case 'win32':
                    platformConfig = require(path.resolve(__dirname, './build/windows.json'));
                    break;

                case 'darwin':
                    platformConfig = require(path.resolve(__dirname, './build/mac.json'));
                    break;

                default:
                    platformConfig = require(path.resolve(__dirname, './build/linux.json'));
                    break;
                }
            }

            // First merge the configs and start in string format for editing
            let buildSettings = JSON.stringify(deepMerge(baseConfig, platformConfig));

            const userConfig = {
                APP_ID: 'com.erisu.electron',
                APP_TITLE: 'My Electron App',
                APP_WWW_DIR: api.locations.www,
                APP_BUILD_DIR: api.locations.build,
                BUILD_TYPE: 'distribution'
            };

            Object.keys(userConfig).forEach((key) => {
                const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
                buildSettings = buildSettings.replace(regex, userConfig[key]);
            });

            // convert back to object after editing.
            buildSettings = JSON.parse(buildSettings);

            return buildSettings;
        })
        .then((buildSettings) => {
            return builder.build(buildSettings);
        })
        .catch((error) => {
            console.log(error);
        });
};

module.exports.help = () => {
    console.log('Usage: cordova build electron');
    console.log('Packages your app for distribution, or running locally.');
};
