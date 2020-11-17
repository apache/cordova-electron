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
const { getPackageJson } = require('./util');

class PackageJsonParser {
    constructor (wwwDir, projectRootDir) {
        // Electron App Package
        this.path = path.join(wwwDir, 'package.json');
        fs.ensureFileSync(this.path);
        this.package = JSON.parse(fs.readFileSync(this.path, 'utf8') || '{}');

        // Force settings that are not allowed to change.
        this.package.main = 'cdv-electron-main.js';

        this.www = wwwDir;
        this.projectRootDir = projectRootDir;
    }

    configure (config) {
        if (config) {
            this.package.name = config.packageName() || 'io.cordova.hellocordova';
            this.package.displayName = config.name() || 'HelloCordova';
            this.package.version = config.version() || '1.0.0';
            this.package.description = config.description() || 'A sample Apache Cordova application that responds to the deviceready event.';

            this.configureHomepage(config);
            this.configureLicense(config);

            if (config.doc.find('author').attrib.email) {
                this.package.author = {
                    name: config.author() || 'Apache Cordova Team',
                    email: config.doc.find('author').attrib.email
                };
            } else {
                this.package.author = config.author() || 'Apache Cordova Team';
            }
        }

        return this;
    }

    static _orderObject (obj) {
        const ordered = {};
        Object.keys(obj).sort().forEach(key => {
            ordered[key] = obj[key];
        });
        return ordered;
    }

    enableDevTools (enable = false) {
        const pkgJson = getPackageJson();
        const devToolsDependency = 'electron-devtools-installer';

        if (enable) {
            if (!this.package.dependencies) {
                this.package.dependencies = {};
            }

            this.package.dependencies[devToolsDependency] = pkgJson.dependencies[devToolsDependency];
            this.package.dependencies = PackageJsonParser._orderObject(this.package.dependencies);
        } else if (
            this.package.dependencies &&
            this.package.dependencies[devToolsDependency]
        ) {
            delete this.package.dependencies[devToolsDependency];
        }

        return this;
    }

    configureHomepage (config) {
        this.package.homepage = (config.doc.find('author') && config.doc.find('author').attrib.href) || 'https://cordova.io';
    }

    configureLicense (config) {
        this.package.license = (config.doc.find('license') && config.doc.find('license').text && config.doc.find('license').text.trim()) || 'Apache-2.0';
    }

    write () {
        fs.writeFileSync(this.path, JSON.stringify(this.package, null, 2), 'utf8');
    }
}

module.exports = PackageJsonParser;
