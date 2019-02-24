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

const rewire = require('rewire');
const handler = rewire('../../../bin/templates/cordova/handler');
const path = require('path');

describe('Handler export', () => {
    describe('www_dir method', () => {
        it('should return the project\'s www dir.', () => {
            const projectDir = 'random-project-dir';
            const actual = handler.www_dir(projectDir);
            const expected = path.join(projectDir, 'www');
            expect(actual).toBe(expected);
        });
    });

    describe('package_name method', () => {
        it('should return default package name when config.xml is missing.', () => {
            const projectDir = 'random-project-dir';

            const existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            handler.__set__('fs', {
                existsSync: existsSyncSpy
            });

            const actual = handler.package_name(projectDir);
            const expected = 'io.cordova.hellocordova';
            expect(actual).toBe(expected);
        });

        it('should return default package name when config.xml is missing.', () => {
            const projectDir = 'random-project-dir';

            const existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            const readFileSyncSpy = jasmine.createSpy('readFileSync').and.returnValue(`
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.foobar.random" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
</widget>
            `);
            handler.__set__('fs', {
                existsSync: existsSyncSpy,
                readFileSync: readFileSyncSpy
            });

            const actual = handler.package_name(projectDir);
            const expected = 'com.foobar.random';
            expect(actual).toBe(expected);
        });
    });

    describe('JSModule', () => {
        describe('Install', () => {
            it('should write module but does not contain json export.', () => {
                const jsModule = {
                    src: 'src',
                    name: 'dummy-module'
                };
                const plugin_id = 'com.foo.dummy-plugin';
                const plugin_dir = 'mock';
                const www_dir = 'www';

                // spies
                const ensureDirSyncSpy = jasmine.createSpy('ensureDirSync').and.returnValue(true);
                const readFileSyncSpy = jasmine.createSpy('readFileSync').and.returnValue('module-content');
                const writeFileSyncSpy = jasmine.createSpy('writeFileSync');
                handler.__set__('fs', {
                    ensureDirSync: ensureDirSyncSpy,
                    readFileSync: readFileSyncSpy,
                    writeFileSync: writeFileSyncSpy
                });

                handler['js-module'].install(jsModule, plugin_dir, plugin_id, www_dir);

                expect(readFileSyncSpy).toHaveBeenCalled();
                expect(ensureDirSyncSpy).toHaveBeenCalled();
                expect(writeFileSyncSpy).toHaveBeenCalled();

                const actual = writeFileSyncSpy.calls.argsFor(0)[1];

                expect(actual).toContain('com.foo.dummy-plugin.dummy-module');
                expect(actual).toContain('module-content');
            });

            it('should write module but does not contain json export.', () => {
                const jsModule = {
                    src: 'src.json',
                    name: 'dummy-module'
                };
                const plugin_id = 'com.foo.dummy-plugin';
                const plugin_dir = 'mock';
                const www_dir = 'www';

                // spies
                const ensureDirSyncSpy = jasmine.createSpy('ensureDirSync').and.returnValue(true);
                const readFileSyncSpy = jasmine.createSpy('readFileSync').and.returnValue('module-content');
                const writeFileSyncSpy = jasmine.createSpy('writeFileSync');
                handler.__set__('fs', {
                    ensureDirSync: ensureDirSyncSpy,
                    readFileSync: readFileSyncSpy,
                    writeFileSync: writeFileSyncSpy
                });

                handler['js-module'].install(jsModule, plugin_dir, plugin_id, www_dir);

                expect(readFileSyncSpy).toHaveBeenCalled();
                expect(ensureDirSyncSpy).toHaveBeenCalled();
                expect(writeFileSyncSpy).toHaveBeenCalled();

                const actual = writeFileSyncSpy.calls.argsFor(0)[1];

                expect(actual).toContain('com.foo.dummy-plugin.dummy-module');
                expect(actual).toContain(`module.exports =  + module-content`);
            });
        });

        describe('Uninstall', () => {
            let emitSpy;
            beforeEach(() => {
                emitSpy = jasmine.createSpy('emit');
                handler.__set__('events', {
                    emit: emitSpy
                });
            });

            it('should emit that js-module uninstall was called.', () => {
                const jsModule = {
                    src: 'src.json',
                    name: 'dummy-module'
                };
                const plugin_id = 'com.foo.dummy-plugin';
                const www_dir = 'www';
                const pluginRelativePath = path.join('plugins', plugin_id, jsModule.src);

                const removeSyncSpy = jasmine.createSpy('writeFileSync');
                handler.__set__('fs', {
                    removeSync: removeSyncSpy
                });

                handler['js-module'].uninstall(jsModule, www_dir, plugin_id);

                expect(removeSyncSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = `js-module uninstall called : ${pluginRelativePath}`;
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });
    });

    describe('SourceFile', () => {
        let emitSpy;
        beforeEach(() => {
            emitSpy = jasmine.createSpy('emit');
            handler.__set__('events', {
                emit: emitSpy
            });
        });

        describe('Install', () => {
            it('should emit that source-file install is not supported.', () => {
                handler['source-file'].install();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'source-file.install is currently not supported for electron';
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });

        describe('Uninstall', () => {
            it('should emit that source-file uninstall is not supported.', () => {
                handler['source-file'].uninstall();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'source-file.uninstall is currently not supported for electron';
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });
    });

    describe('HeaderFile', () => {
        let emitSpy;
        beforeEach(() => {
            emitSpy = jasmine.createSpy('emit');
            handler.__set__('events', {
                emit: emitSpy
            });
        });

        describe('Install', () => {
            it('should emit that header-file install is not supported.', () => {
                handler['header-file'].install();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'header-file.install is not supported for electron';
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });

        describe('Uninstall', () => {
            it('should emit that header-file uninstall is not supported.', () => {
                handler['header-file'].uninstall();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'header-file.uninstall is not supported for electron';
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });
    });

    describe('ResourceFile', () => {
        let emitSpy;
        beforeEach(() => {
            emitSpy = jasmine.createSpy('emit');
            handler.__set__('events', {
                emit: emitSpy
            });
        });

        describe('Install', () => {
            it('should emit that resource-file install is not supported.', () => {
                handler['resource-file'].install();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'resource-file.install is not supported for electron';
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });

        describe('Uninstall', () => {
            it('should emit that resource-file uninstall is not supported.', () => {
                handler['resource-file'].uninstall();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'resource-file.uninstall is not supported for electron';
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });
    });

    describe('Framework', () => {
        let emitSpy;
        beforeEach(() => {
            emitSpy = jasmine.createSpy('emit');
            handler.__set__('events', {
                emit: emitSpy
            });
        });

        describe('Install', () => {
            it('should emit that framework install is not supported.', () => {
                handler['framework'].install();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'framework.install is not supported for electron';
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });

        describe('Uninstall', () => {
            it('should emit that framework uninstall is not supported.', () => {
                handler['framework'].uninstall();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'framework.uninstall is not supported for electron';
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });
    });

    describe('LibFile', () => {
        let emitSpy;
        beforeEach(() => {
            emitSpy = jasmine.createSpy('emit');
            handler.__set__('events', {
                emit: emitSpy
            });
        });

        describe('Install', () => {
            it('should emit that lib-file install is not supported.', () => {
                handler['lib-file'].install();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'lib-file.install is not supported for electron';
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });

        describe('Uninstall', () => {
            it('should emit that lib-file uninstall is not supported.', () => {
                handler['lib-file'].uninstall();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'lib-file.uninstall is not supported for electron';
                expect(emitSpy).toHaveBeenCalled();
                expect(actual).toBe(expected);
            });
        });
    });

    describe('Assets', () => {
        const plugin_dir = 'pluginDir';
        const wwwDest = 'dest';

        describe('Install', () => {
            it('should copySync with a directory path.', () => {
                const asset = {
                    itemType: 'asset',
                    src: 'someSrc/ServiceWorker.js',
                    target: 'ServiceWorker.js'
                };

                // Spies
                const copySyncSpy = jasmine.createSpy('copySync');
                const ensureDirSyncSpy = jasmine.createSpy('ensureDirSync').and.returnValue(true);

                handler.__set__('fs', {
                    copySync: copySyncSpy,
                    ensureDirSync: ensureDirSyncSpy
                });

                handler.asset.install(asset, plugin_dir, wwwDest);
                expect(ensureDirSyncSpy).toHaveBeenCalled();
                expect(copySyncSpy).toHaveBeenCalledWith(jasmine.any(String), path.join('dest', asset.target));
            });

            it('should call copySync with a file path.', () => {
                const asset = {
                    itemType: 'asset',
                    src: 'someSrc/ServiceWorker.js',
                    target: 'ServiceWorker.js'
                };

                // Spies
                const copySyncSpy = jasmine.createSpy('copySync');
                const ensureDirSyncSpy = jasmine.createSpy('ensureDirSync');

                handler.__set__('fs', {
                    copySync: copySyncSpy,
                    ensureDirSync: ensureDirSyncSpy
                });

                handler.asset.install(asset, plugin_dir, wwwDest);
                expect(ensureDirSyncSpy).toHaveBeenCalled();
                expect(copySyncSpy).toHaveBeenCalledWith(jasmine.any(String), path.join('dest', asset.target));
            });
        });

        describe('Uninstall', () => {
            it('should remove assets', () => {
                const asset = { itemType: 'asset', src: 'someSrc', target: 'ServiceWorker.js' };
                const mockPluginId = 'com.foobar.random-plugin-id';

                // Spies
                const fsRemoveSyncSpy = jasmine.createSpy('removeSync');
                handler.__set__('fs', {
                    removeSync: fsRemoveSyncSpy
                });

                handler.asset.uninstall(asset, wwwDest, mockPluginId);

                expect(fsRemoveSyncSpy).toHaveBeenCalled();
                expect(fsRemoveSyncSpy.calls.argsFor(0)[0]).toBe(path.join(wwwDest, asset.target));
                expect(fsRemoveSyncSpy.calls.argsFor(1)[0]).toBe(path.join(wwwDest, 'plugins', mockPluginId));
            });
        });
    });
});
