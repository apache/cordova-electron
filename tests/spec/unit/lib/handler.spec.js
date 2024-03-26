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

const path = require('node:path');
const fs = require('node:fs');
const { events } = require('cordova-common');
const rewire = require('rewire');

const rootDir = path.resolve(__dirname, '../../../..');
const fixturesDir = path.join(rootDir, 'tests/spec/fixtures');
const tmpDir = path.join(rootDir, 'temp');
const testProjectDir = path.join(tmpDir, 'testapp');

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
                spyOn(fs, 'mkdirSync').and.returnValue(true);
                spyOn(fs, 'writeFileSync');

                handler['js-module'].install(jsModule, plugin_dir, plugin_id, www_dir);

                const moduleDetination = path.dirname(path.resolve(www_dir, 'plugins', plugin_id, jsModule.src));
                const writeFileSyncContent = fs.writeFileSync.calls.argsFor(0)[1];

                expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve(plugin_dir, jsModule.src), 'utf8');
                expect(fs.mkdirSync).toHaveBeenCalledWith(moduleDetination, { recursive: true });
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
                spyOn(fs, 'rmSync').and.returnValue(true);
                spyOn(events, 'emit');

                handler['js-module'].uninstall(jsModule, www_dir, plugin_id);

                expect(fs.rmSync).toHaveBeenCalledWith(path.join(www_dir, 'plugins', plugin_id), { recursive: true, force: true });
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
            it('should cpSync assets to destination.', () => {
                const asset = {
                    itemType: 'asset',
                    src: 'someSrc/ServiceWorker.js',
                    target: 'ServiceWorker.js'
                };

                // Spies
                spyOn(fs, 'cpSync');
                spyOn(fs, 'mkdirSync').and.returnValue(true);

                handler.asset.install(asset, plugin_dir, wwwDest);

                expect(fs.mkdirSync).toHaveBeenCalled();
                expect(fs.cpSync).toHaveBeenCalledWith(jasmine.any(String), path.join('dest', asset.target), { recursive: true });
            });
        });

        describe('asset.uninstall', () => {
            it('should remove assets', () => {
                const asset = { itemType: 'asset', src: 'someSrc', target: 'ServiceWorker.js' };
                const mockPluginId = 'com.foobar.random-plugin-id';

                // Spies
                spyOn(fs, 'rmSync').and.returnValue(true);

                handler.asset.uninstall(asset, wwwDest, mockPluginId);

                expect(fs.rmSync).toHaveBeenCalled();
                expect(fs.rmSync.calls.argsFor(0)[0]).toBe(path.join(wwwDest, asset.target));
                expect(fs.rmSync.calls.argsFor(1)[0]).toBe(path.join(wwwDest, 'plugins', mockPluginId));
            });
        });
    });

    describe('framework method', () => {
        const frameworkInstallMockObject = {
            itemType: 'framework',
            type: undefined,
            parent: undefined,
            custom: false,
            embed: false,
            src: 'src/electron',
            spec: undefined,
            weak: false,
            versions: undefined,
            targetDir: undefined,
            deviceTarget: undefined,
            arch: undefined,
            implementation: undefined
        };

        const frameworkInstallPluginId = 'cordova-plugin-sample';
        const frameworkInstallElectronPluginId = `${frameworkInstallPluginId}-electron`;
        const frameworkInstallPluginDir = path.join(testProjectDir, `plugins/${frameworkInstallPluginId}`);
        const frameworkInstallProjectDir = path.join(testProjectDir, 'platforms/electron');
        const frameworkInstallProjectAppPackageFile = path.join(frameworkInstallProjectDir, 'www/package.json');
        const frameworkInstallPluginPackageFile = path.join(frameworkInstallPluginDir, 'src/electron/package.json');

        beforeEach(() => {
            fs.mkdirSync(tmpDir, { recursive: true });
            fs.cpSync(path.resolve(fixturesDir, 'test-app-with-electron-plugin'), testProjectDir, { recursive: true });

            spyOn(events, 'emit');
        });

        afterEach(() => {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        describe('framework.install', () => {
            it('should not install framework when the source path does not exist.', async () => {
                const execaSpy = jasmine.createSpy('execa');
                handler.__set__('execa', execaSpy);

                spyOn(fs, 'existsSync').and.returnValue(false);

                await handler.framework.install(
                    frameworkInstallMockObject,
                    frameworkInstallPluginDir,
                    frameworkInstallProjectDir,
                    frameworkInstallPluginId
                );

                expect(events.emit).toHaveBeenCalledWith(
                    'warn',
                    '[Cordova Electron] The defined "framework" source path does not exist and can not be installed.'
                );
                events.emit.calls.reset();
            });

            it('should update the electron app package when service is registered', async () => {
                const execaSpy = jasmine.createSpy('execa');
                handler.__set__('execa', execaSpy);

                // Mock npm install by updating the App's package.json
                const appPackage = JSON.parse(
                    fs.readFileSync(frameworkInstallProjectAppPackageFile, 'utf8')
                );

                appPackage.dependencies[frameworkInstallElectronPluginId] = path.relative(
                    frameworkInstallProjectAppPackageFile,
                    path.join(frameworkInstallPluginDir, 'src/electron')
                );

                fs.writeFileSync(
                    frameworkInstallProjectAppPackageFile,
                    JSON.stringify(appPackage, null, 2),
                    'utf8'
                );

                await handler.framework.install(
                    frameworkInstallMockObject,
                    frameworkInstallPluginDir,
                    frameworkInstallProjectDir,
                    frameworkInstallPluginId
                );

                // Validate that sample plugin's service is registered.
                const validateAppPackage = JSON.parse(fs.readFileSync(frameworkInstallProjectAppPackageFile, 'utf8'));
                const test = validateAppPackage && validateAppPackage.cordova && validateAppPackage.cordova.services && validateAppPackage.cordova.services.Sample;
                expect(test).toBe(frameworkInstallElectronPluginId);
            });

            it('should not update the electron app package when there are no registered service', async () => {
                const execaSpy = jasmine.createSpy('execa').and.returnValue({
                    stdout: frameworkInstallElectronPluginId
                });
                handler.__set__('execa', execaSpy);

                // Mock npm install by updating the App's package.json
                const appPackage = JSON.parse(
                    fs.readFileSync(frameworkInstallProjectAppPackageFile, 'utf8')
                );

                appPackage.dependencies[frameworkInstallElectronPluginId] = path.relative(
                    frameworkInstallProjectAppPackageFile,
                    path.join(frameworkInstallPluginDir, 'src/electron')
                );

                fs.writeFileSync(
                    frameworkInstallProjectAppPackageFile,
                    JSON.stringify(appPackage, null, 2),
                    'utf8'
                );

                const pluginPackage = JSON.parse(fs.readFileSync(frameworkInstallPluginPackageFile, 'utf8'));
                delete pluginPackage.cordova;

                fs.writeFileSync(
                    frameworkInstallPluginPackageFile,
                    JSON.stringify(pluginPackage, null, 2),
                    'utf8'
                );

                await handler.framework.install(
                    frameworkInstallMockObject,
                    frameworkInstallPluginDir,
                    frameworkInstallProjectDir,
                    frameworkInstallPluginId
                );

                // Validate that sample plugin's service is registered.
                const validateAppPackage = JSON.parse(fs.readFileSync(frameworkInstallProjectAppPackageFile, 'utf8'));
                const test = validateAppPackage && validateAppPackage.cordova && validateAppPackage.cordova.services && validateAppPackage.cordova.services.Sample;
                expect(test).not.toBe(frameworkInstallElectronPluginId);
            });

            it('should warn when there are conflicting service name between more then one plugin', async () => {
                const execaSpy = jasmine.createSpy('execa').and.returnValue({
                    stdout: frameworkInstallElectronPluginId
                });
                handler.__set__('execa', execaSpy);

                // Mock npm install by updating the App's package.json
                const appPackage = JSON.parse(
                    fs.readFileSync(frameworkInstallProjectAppPackageFile, 'utf8')
                );

                appPackage.dependencies[frameworkInstallElectronPluginId] = path.relative(
                    frameworkInstallProjectAppPackageFile,
                    path.join(frameworkInstallPluginDir, 'src/electron')
                );

                // fake some other sample service already registered
                appPackage.cordova = appPackage.cordova || {};
                appPackage.cordova.services = appPackage.cordova.services || {
                    Sample: 'cordova-plugin-sample-electron'
                };

                fs.writeFileSync(
                    frameworkInstallProjectAppPackageFile,
                    JSON.stringify(appPackage, null, 2),
                    'utf8'
                );

                await handler.framework.install(
                    frameworkInstallMockObject,
                    frameworkInstallPluginDir,
                    frameworkInstallProjectDir,
                    frameworkInstallPluginId
                );

                expect(events.emit).toHaveBeenCalledWith(
                    'warn',
                    '[Cordova Electron] The service name "Sample" is already taken by "cordova-plugin-sample-electron" and can not be redeclared.'
                );
                events.emit.calls.reset();
            });
        });

        describe('framework.uninstall', () => {
            it('should delink service name if defined', async () => {
                const execaSpy = jasmine.createSpy('execa');
                handler.__set__('execa', execaSpy);

                // Mock npm install by updating the App's package.json
                const appPackage = JSON.parse(
                    fs.readFileSync(frameworkInstallProjectAppPackageFile, 'utf8')
                );

                appPackage.dependencies[frameworkInstallElectronPluginId] = path.relative(
                    frameworkInstallProjectAppPackageFile,
                    path.join(frameworkInstallPluginDir, 'src/electron')
                );

                // fake some other sample service already registered
                appPackage.cordova = appPackage.cordova || {};
                appPackage.cordova.services = appPackage.cordova.services || {
                    Sample: 'cordova-plugin-sample-electron'
                };

                fs.writeFileSync(
                    frameworkInstallProjectAppPackageFile,
                    JSON.stringify(appPackage, null, 2),
                    'utf8'
                );

                await handler.framework.uninstall(
                    frameworkInstallMockObject,
                    frameworkInstallPluginDir,
                    frameworkInstallProjectDir
                );

                expect(events.emit).toHaveBeenCalledWith(
                    'verbose',
                    '[Cordova Electron] The service name "Sample" was delinked.'
                );
                events.emit.calls.reset();
            });

            it('should not delink service name if defined by another plugin', async () => {
                const execaSpy = jasmine.createSpy('execa');
                handler.__set__('execa', execaSpy);

                // Mock npm install by updating the App's package.json
                const appPackage = JSON.parse(
                    fs.readFileSync(frameworkInstallProjectAppPackageFile, 'utf8')
                );

                appPackage.dependencies[frameworkInstallElectronPluginId] = path.relative(
                    frameworkInstallProjectAppPackageFile,
                    path.join(frameworkInstallPluginDir, 'src/electron')
                );

                // fake some other sample service already registered
                appPackage.cordova = appPackage.cordova || {};
                appPackage.cordova.services = appPackage.cordova.services || {
                    Sample: 'some-other-package'
                };

                fs.writeFileSync(
                    frameworkInstallProjectAppPackageFile,
                    JSON.stringify(appPackage, null, 2),
                    'utf8'
                );

                await handler.framework.uninstall(
                    frameworkInstallMockObject,
                    frameworkInstallPluginDir,
                    frameworkInstallProjectDir
                );

                expect(events.emit).not.toHaveBeenCalled();
            });

            it('should not delink service name when not defined', async () => {
                const execaSpy = jasmine.createSpy('execa');
                handler.__set__('execa', execaSpy);

                await handler.framework.uninstall(
                    frameworkInstallMockObject,
                    frameworkInstallPluginDir,
                    frameworkInstallProjectDir
                );

                expect(events.emit).not.toHaveBeenCalled();
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
