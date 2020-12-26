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

const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');
const { events } = require('cordova-common');
const { _orderObject } = require('./PackageJsonParser');
const { deepMerge } = require('./util');

module.exports = {
    www_dir: (project_dir) => path.join(project_dir, 'www'),
    package_name: (project_dir) => {
        // this method should the id from root config.xml => <widget id=xxx
        // return common.package_name(project_dir, this.www_dir(project_dir));
        let pkgName = 'io.cordova.hellocordova';
        const widget_id_regex = /(?:<widget\s+id=['"])(\S+)(?:['"])/;
        const configPath = path.join(project_dir, 'config.xml');

        if (fs.existsSync(configPath)) {
            const configStr = fs.readFileSync(configPath, 'utf8');
            const res = configStr.match(widget_id_regex);

            if (res && res.length > 1) {
                pkgName = res[1];
            }
        }

        return pkgName;
    },
    'js-module': {
        install: (jsModule, plugin_dir, plugin_id, www_dir) => {
            // Copy the plugin's files into the www directory.
            const moduleSource = path.resolve(plugin_dir, jsModule.src);
            // Get module name based on existing 'name' attribute or filename
            // Must use path.extname/path.basename instead of path.parse due to CB-9981
            const moduleName = `${plugin_id}.${jsModule.name || path.basename(jsModule.src, path.extname(jsModule.src))}`;

            // Read in the file, prepend the cordova.define, and write it back out.
            let scriptContent = fs.readFileSync(moduleSource, 'utf-8').replace(/^\ufeff/, ''); // Window BOM

            if (moduleSource.match(/.*\.json$/)) {
                scriptContent = `module.exports =  + ${scriptContent}`;
            }

            scriptContent = `cordova.define('${moduleName}', function (require, exports, module) {
                ${scriptContent}
            });`;

            const moduleDestination = path.resolve(www_dir, 'plugins', plugin_id, jsModule.src);

            fs.ensureDirSync(path.dirname(moduleDestination));
            fs.writeFileSync(moduleDestination, scriptContent, 'utf-8');
        },
        uninstall: (jsModule, www_dir, plugin_id) => {
            fs.removeSync(path.join(www_dir, 'plugins', plugin_id));
            const pluginRelativePath = path.join('plugins', plugin_id, jsModule.src);
            // common.removeFileAndParents(www_dir, pluginRelativePath);
            events.emit('verbose', `js-module uninstall called : ${pluginRelativePath}`);
        }
    },
    'source-file': {
        install: (obj, plugin_dir, project_dir, plugin_id, options) => {
            // var dest = path.join(obj.targetDir, path.basename(obj.src));
            // common.copyFile(plugin_dir, obj.src, project_dir, dest);
            events.emit('verbose', 'source-file.install is not supported for electron');
        },
        uninstall: (obj, plugin_dir, project_dir, plugin_id, options) => {
            // var dest = path.join(obj.targetDir, path.basename(obj.src));
            // common.removeFile(project_dir, dest);
            events.emit('verbose', 'source-file.uninstall is not supported for electron');
        }
    },
    'header-file': {
        install: (obj, plugin_dir, project_dir, plugin_id, options) => {
            events.emit('verbose', 'header-file.install is not supported for electron');
        },
        uninstall: (obj, plugin_dir, project_dir, plugin_id, options) => {
            events.emit('verbose', 'header-file.uninstall is not supported for electron');
        }
    },
    'resource-file': {
        install: (obj, plugin_dir, project_dir, plugin_id, options) => {
            events.emit('verbose', 'resource-file.install is not supported for electron');
        },
        uninstall: (obj, plugin_dir, project_dir, plugin_id, options) => {
            events.emit('verbose', 'resource-file.uninstall is not supported for electron');
        }
    },
    framework: {
        install: (obj, plugin_dir, project_dir, plugin_id, options) => {
            const electronPluginSrc = path.resolve(plugin_dir, obj.src);

            if (!fs.existsSync(electronPluginSrc)) {
                events.emit(
                    'warn',
                    '[Cordova Electron] The defined "framework" source path does not exist and can not be installed.'
                );
                return;
            }

            const wwwDir = path.join(project_dir, 'www');

            execa('npm', ['install', electronPluginSrc], {
                cwd: wwwDir
            });

            const appPackageFile = path.join(wwwDir, 'package.json');
            let appPackage = JSON.parse(fs.readFileSync(appPackageFile, 'utf8'));
            const pluginPackage = JSON.parse(fs.readFileSync(path.join(electronPluginSrc, 'package.json'), 'utf8'));

            if (!pluginPackage.cordova || !pluginPackage.cordova.serviceName) {
                return;
            }

            const serviceName = pluginPackage.cordova.serviceName;

            if (
                appPackage.cordova &&
                appPackage.cordova.services &&
                appPackage.cordova.services[serviceName]
            ) {
                events.emit(
                    'warn',
                    `[Cordova Electron] The service name "${serviceName}" is already taken by "${appPackage.cordova.services[serviceName]}" and can not be redeclared.`
                );
                return;
            }

            const appendingData = {
                cordova: {
                    services: {
                        [serviceName]: pluginPackage.name
                    }
                }
            };

            appPackage = deepMerge(appPackage, appendingData);

            appPackage.cordova.services = _orderObject(appPackage.cordova.services);
            fs.writeFileSync(
                appPackageFile,
                JSON.stringify(appPackage, null, 2),
                'utf8'
            );
        },
        uninstall: (obj, plugin_dir, project_dir, plugin_id, options) => {
            const electronPluginPackageFile = path.resolve(plugin_dir, obj.src, 'package.json');
            const electronPluginPackage = JSON.parse(
                fs.readFileSync(electronPluginPackageFile, 'utf8')
            );

            const electronPluginName = electronPluginPackage.name;
            const wwwDir = path.join(project_dir, 'www');

            console.log(electronPluginPackageFile);
            console.log(electronPluginName);

            execa('npm', ['uninstall', electronPluginName], {
                cwd: wwwDir
            });

            const appPackageFile = path.join(wwwDir, 'package.json');
            const appPackage = JSON.parse(fs.readFileSync(appPackageFile, 'utf8'));

            if (
                appPackage &&
                appPackage.cordova &&
                appPackage.cordova.services
            ) {
                let hasUpdatedPackage = false;
                Object.keys(appPackage.cordova.services).forEach(serviceName => {
                    if (appPackage.cordova.services[serviceName] === electronPluginName) {
                        delete appPackage.cordova.services[serviceName];
                        hasUpdatedPackage = true;
                        events.emit(
                            'verbose',
                            `[Cordova Electron] The service name "${serviceName}" was delinked.`
                        );
                    }
                });

                if (hasUpdatedPackage) {
                    fs.writeFileSync(
                        appPackageFile,
                        JSON.stringify(appPackage, null, 2),
                        'utf8'
                    );
                }
            }
        }
    },
    'lib-file': {
        install: (obj, plugin_dir, project_dir, plugin_id, options) => {
            events.emit('verbose', 'lib-file.install is not supported for electron');
        },
        uninstall: (obj, plugin_dir, project_dir, plugin_id, options) => {
            events.emit('verbose', 'lib-file.uninstall is not supported for electron');
        }
    },
    asset: {
        install: (asset, plugin_dir, wwwDest) => {
            const src = path.join(plugin_dir, asset.src);
            const dest = path.join(wwwDest, asset.target);
            const destDir = path.parse(dest).dir;

            fs.ensureDirSync(destDir);
            fs.copySync(src, dest);
        },
        uninstall: (asset, wwwDest, plugin_id) => {
            fs.removeSync(path.join(wwwDest, asset.target));
            fs.removeSync(path.join(wwwDest, 'plugins', plugin_id));
        }
    }
};
