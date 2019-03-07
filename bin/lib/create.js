#!/usr/bin/env node

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

const fs = require('fs-extra');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const events = require('cordova-common').events;
const check_reqs = require('./../templates/cordova/lib/check_reqs.js');

// exported method to create a project, returns a promise that resolves with null
module.exports.createProject = (project_path, package_name, project_name, options) => {
/*
    // create the dest and the standard place for our api to live
    // platforms/platformName/cordova/Api.js
*/

    events.emit('log', 'Creating Cordova project for cordova-electron:');
    events.emit('log', '\tPath: ' + project_path);
    events.emit('log', '\tName: ' + project_name);

    // Set default values for path, package and name
    project_path = project_path || 'CordovaExample';

    // Check if project already exists
    if (fs.existsSync(project_path)) {
        events.emit('error', 'Oops, destination already exists! Delete it and try again');
    }

    // Check that requirements are met and proper targets are installed
    if (!check_reqs.run()) {
        // TODO: use events.emit
        events.emit('error', 'Please make sure you meet the software requirements in order to build a cordova electron project');
    }

    // Make sure that the platform directory is created if missing.
    fs.ensureDirSync(project_path);

    // copy templates/build-res directory ( recursive )
    fs.copySync(path.join(ROOT, 'bin/templates/build-res'), path.join(project_path, 'build-res'), { overwrite: false });

    // copy templates/cordova directory ( recursive )
    fs.copySync(path.join(ROOT, 'bin/templates/cordova'), path.join(project_path, 'cordova'), { overwrite: false });

    // copy templates/www directory ( recursive )
    fs.copySync(path.join(ROOT, 'bin/templates/project/www'), path.join(project_path, 'www'), { overwrite: false });

    // recreate our node_modules structure in the new project
    if (fs.existsSync(path.join(ROOT, 'node_modules'))) {
        fs.copySync(path.join(ROOT, 'node_modules'), path.join(project_path, 'cordova', 'node_modules'), { overwrite: false });
    }

    const platform_www = path.join(project_path, 'platform_www');

    fs.ensureDirSync(platform_www);

    // copy cordova-js-src directory
    fs.copySync(path.join(ROOT, 'cordova-js-src'), path.join(platform_www, 'cordova-js-src'), { overwrite: false });

    // copy cordova js file to platform_www
    fs.copySync(path.join(ROOT, 'cordova-lib', 'cordova.js'), path.join(platform_www, 'cordova.js'), { overwrite: false });

    // copy cdv-electron-main.js
    fs.copySync(path.join(ROOT, 'bin/templates/project/cdv-electron-main.js'), path.join(platform_www, 'cdv-electron-main.js'), { overwrite: false });

    // copy cdv-electron-settings.json
    fs.copySync(path.join(ROOT, 'bin/templates/project/cdv-electron-settings.json'), path.join(platform_www, 'cdv-electron-settings.json'), { overwrite: false });

    return Promise.resolve();
};
