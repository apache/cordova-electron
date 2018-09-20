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
const CordovaError = require('cordova-common').CordovaError;
const events = require('cordova-common').events;
const FileUpdater = require('cordova-common').FileUpdater;

function dirExists (dir) {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

function parser (project) {
    if (!dirExists(project) || !dirExists(path.join(project, 'cordova'))) {
        throw new CordovaError(`The provided path "${project}" is not a valid electron project.`);
    }

    this.path = project;
}

module.exports = parser;

// Returns a promise.
parser.prototype.update_from_config = () => Promise.resolve();
parser.prototype.www_dir = () => path.join(this.path, 'www');

// Used for creating platform_www in projects created by older versions.
parser.prototype.cordovajs_path = (libDir) => path.resolve(path.join(libDir, 'cordova-lib', 'cordova.js'));
parser.prototype.cordovajs_src_path = (libDir) => path.resolve(path.join(libDir, 'cordova-js-src'));

/**
 * Logs all file operations via the verbose event stream, indented.
 */
function logFileOp (message) {
    events.emit('verbose', '  ' + message);
}

// Replace the www dir with contents of platform_www and app www.
parser.prototype.update_www = function (cordovaProject, opts) {
    const platform_www = path.join(this.path, 'platform_www');
    const my_www = this.www_dir();
    // add cordova www and platform_www to sourceDirs
    let sourceDirs = [
        path.relative(cordovaProject.root, cordovaProject.locations.www),
        path.relative(cordovaProject.root, platform_www)
    ];

    // If project contains 'merges' for our platform, use them as another overrides
    const merges_path = path.join(cordovaProject.root, 'merges', 'electron');
    if (fs.existsSync(merges_path)) {
        events.emit('verbose', 'Found "merges/electron" folder. Copying its contents into the electron project.');
        // add merges/electron to sourceDirs
        sourceDirs.push(path.join('merges', 'electron'));
    }

    // targetDir points to electron/www
    const targetDir = path.relative(cordovaProject.root, my_www);
    events.emit('verbose', `Merging and updating files from [${sourceDirs.join(', ')}] to ${targetDir}`);
    FileUpdater.mergeAndUpdateDir(sourceDirs, targetDir, { rootDir: cordovaProject.root }, logFileOp);
};

parser.prototype.update_overrides = function () {
    // console.log("update_overrides");

    // TODO: ?
    // var projectRoot = util.isCordova(this.path);
    // var mergesPath = path.join(util.appDir(projectRoot), 'merges', 'electron');
    // if(fs.existsSync(mergesPath)) {
    //     var overrides = path.join(mergesPath, '*');
    //     fs.copySync(overrides, this.www_dir());
    // }
};

parser.prototype.config_xml = () => path.join(this.path, 'config.xml');

// Returns a promise.
parser.prototype.update_project = (cfg) => {
    // console.log("update_project ",cfg);
    const defer = this.update_from_config();
    const www_dir = this.www_dir();

    defer.then(() => {
        this.update_overrides();
        // Copy munged config.xml to platform www dir
        fs.copySync(path.join(www_dir, '..', 'config.xml'), www_dir);
    });

    return defer;
};
