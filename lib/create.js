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
const rootDir = path.resolve(__dirname, '..');
const events = require('cordova-common').events;
const check_reqs = require(path.join(rootDir, 'lib/check_reqs'));

// exported method to create a project, returns a promise that resolves with null
module.exports.createProject = (platform_dir, package_name, project_name, options) => {
/*
    // create the dest and the standard place for our api to live
    // platforms/platformName/cordova/Api.js
*/

    events.emit('log', 'Creating Cordova project for cordova-electron:');
    events.emit('log', '\tPath: ' + platform_dir);
    events.emit('log', '\tName: ' + project_name);

    // Check if project already exists
    if (fs.existsSync(platform_dir)) {
        events.emit('error', 'Oops, destination already exists! Delete it and try again');
    }

    // Check that requirements are met and proper targets are installed
    if (!check_reqs.run()) {
        // TODO: use events.emit
        events.emit('error', 'Please make sure you meet the software requirements in order to build a cordova electron project');
    }

    // Make sure that the platform directory is created if missing.
    fs.ensureDirSync(platform_dir);

    // copy templates directory to the platform directory recursively
    fs.copySync(path.join(rootDir, 'bin/templates'), path.join(platform_dir), { overwrite: false });

    return Promise.resolve();
};
