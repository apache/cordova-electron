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
const { events } = require('cordova-common');
const rewire = require('rewire');

const rootDir = path.resolve(__dirname, '../../../..');

const handler = rewire(path.join(rootDir, 'lib/handler'));

describe('Handler export', () => {
    describe('www_dir method', () => {
        it('should return the project\'s www dir.', () => {
            const projectDir = 'mocked-project-dir-path';
            expect(
                handler.www_dir(projectDir)
            ).toBe(path.join(projectDir, 'www'));
        });
    });

    describe('package_name method', () => {
        it('should return default package name when config.xml file is missing', () => {
            spyOn(fs, 'existsSync').and.returnValue(false);
            expect(
                handler.package_name('mocked-project-dir-path')
            ).toBe('io.cordova.hellocordova');
        });

        it('should return default package name when config.xml file does not contain the widget id', () => {
            spyOn(fs, 'existsSync').and.returnValue(true);
            spyOn(fs, 'readFileSync').and.returnValue(''); // blank config.file
            expect(
                handler.package_name('mocked-project-dir-path')
            ).toBe('io.cordova.hellocordova');
        });

        it('should return package name defined on the widget element id attribute in config.xml file', () => {
            spyOn(fs, 'existsSync').and.returnValue(true);
            spyOn(fs, 'readFileSync').and.returnValue(`
                <?xml version='1.0' encoding='utf-8'?>
                    <widget id="com.foobar.random" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
                </widget>
            `);
            expect(
                handler.package_name('mocked-project-dir-path')
            ).toBe('com.foobar.random');
        });
    });

    describe('js-module method', () => {
        describe('js-module.install', () => {
            const moduleExportTestCase = jsModule => {
                const plugin_dir = 'mock';
                const plugin_id = 'com.foo.dummy-plugin';
                const www_dir = 'www';
                const moduleName = `${plugin_id}.${jsModule.name || path.basename(jsModule.src, path.extname(jsModule.src))}`;

                // spies
                spyOn(fs, 'readFileSync').and.returnValue(''); // fake scriptContent
                spyOn(fs, 'ensureDirSync').and.returnValue(true);
                spyOn(fs, 'writeFileSync');

                handler['js-module'].install(jsModule, plugin_dir, plugin_id, www_dir);

                const moduleDetination = path.dirname(path.resolve(www_dir, 'plugins', plugin_id, jsModule.src));
                const writeFileSyncContent = fs.writeFileSync.calls.argsFor(0)[1];

                expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve(plugin_dir, jsModule.src), 'utf-8');
                expect(fs.ensureDirSync).toHaveBeenCalledWith(moduleDetination);
                expect(writeFileSyncContent).toContain(`cordova.define('${moduleName}'`);

                return writeFileSyncContent;
            };

            it('should write cordova.define for module "com.foo.dummy-plugin.dummy-module" (from source name) and not module.exports as module source is not JSON.', () => {
                const jsModule = { src: 'src/dummy-module', name: 'dummy-module' };
                const writeFileSyncContent = moduleExportTestCase(jsModule);
                expect(writeFileSyncContent).not.toContain('module.exports');
            });

            it('should write cordova.define for module "com.foo.dummy-plugin.dummy-module" (from source filepath) and not module.exports as module source is not JSON.', () => {
                const jsModule = { src: 'src/dummy-module' };
                const writeFileSyncContent = moduleExportTestCase(jsModule);
                expect(writeFileSyncContent).not.toContain('module.exports');
            });

            it('should write cordova.define for module "com.foo.dummy-plugin.dummy-module" (from source filepath) and not module.exports as module source is not JSON.', () => {
                const jsModule = { src: 'src/dummy-module/something.json' };
                const writeFileSyncContent = moduleExportTestCase(jsModule);
                expect(writeFileSyncContent).toContain('module.exports');
            });
        });

        describe('js-module.uninstall', () => {
            it('should emit that js-module uninstall was called.', () => {
                const jsModule = { src: 'src/dummy-module', name: 'dummy-module' };
                const www_dir = 'www';
                const plugin_id = 'com.foo.dummy-plugin';

                // spies
                spyOn(fs, 'removeSync').and.returnValue(true);
                spyOn(events, 'emit');

                handler['js-module'].uninstall(jsModule, www_dir, plugin_id);

                expect(fs.removeSync).toHaveBeenCalledWith(path.join(www_dir, 'plugins', plugin_id));
                expect(events.emit).toHaveBeenCalledWith(
                    'verbose',
                    `js-module uninstall called : ${path.join('plugins', plugin_id, jsModule.src)}`
                );
            });
        });
    });

    describe('asset method', () => {
        const plugin_dir = 'pluginDir';
        const wwwDest = 'dest';

        describe('asset.install', () => {
            it('should copySync assets to destination.', () => {
                const asset = {
                    itemType: 'asset',
                    src: 'someSrc/ServiceWorker.js',
                    target: 'ServiceWorker.js'
                };

                // Spies
                spyOn(fs, 'copySync');
                spyOn(fs, 'ensureDirSync').and.returnValue(true);

                handler.asset.install(asset, plugin_dir, wwwDest);

                expect(fs.ensureDirSync).toHaveBeenCalled();
                expect(fs.copySync).toHaveBeenCalledWith(jasmine.any(String), path.join('dest', asset.target));
            });
        });

        describe('asset.uninstall', () => {
            it('should remove assets', () => {
                const asset = { itemType: 'asset', src: 'someSrc', target: 'ServiceWorker.js' };
                const mockPluginId = 'com.foobar.random-plugin-id';

                // Spies
                spyOn(fs, 'removeSync').and.returnValue(true);

                handler.asset.uninstall(asset, wwwDest, mockPluginId);

                expect(fs.removeSync).toHaveBeenCalled();
                expect(fs.removeSync.calls.argsFor(0)[0]).toBe(path.join(wwwDest, asset.target));
                expect(fs.removeSync.calls.argsFor(1)[0]).toBe(path.join(wwwDest, 'plugins', mockPluginId));
            });
        });
    });

    describe('Unsupported Handlers', () => {
        it('should emit that the install and uninstall methods are not supported for X types.', () => {
            spyOn(events, 'emit');

            // loop unsupported types
            [
                'source-file',
                'header-file',
                'resource-file',
                'lib-file'
            ].forEach(type => {
                for (const method of ['install', 'uninstall']) {
                    handler[type][method]();
                    expect(events.emit).toHaveBeenCalledWith(
                        'verbose',
                        `${type}.${method} is not supported for electron`
                    );
                    events.emit.calls.reset();
                }
            });
        });
    });
});
