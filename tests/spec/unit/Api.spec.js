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
const rewire = require('rewire');
const templateDir = path.resolve(__dirname, '..', '..', '..', 'bin', 'templates');
const Api = rewire(path.join(templateDir, 'cordova', 'Api'));
const tmpDir = path.join(__dirname, '../temp');
const apiRequire = Api.__get__('require');

describe('Api class', () => {
    const api = new Api(null, tmpDir);
    const apiEvents = Api.__get__('selfEvents');
    apiEvents.removeAllListeners();

    const mockExpectedLocations = {
        platformRootDir: tmpDir,
        root: templateDir,
        www: path.join(templateDir, 'www'),
        res: path.join(templateDir, 'res'),
        platformWww: path.join(templateDir, 'platform_www'),
        configXml: path.join(templateDir, 'config.xml'),
        defaultConfigXml: path.join(templateDir, 'cordova/defaults.xml'),
        build: path.join(templateDir, 'build'),
        buildRes: path.join(templateDir, 'build-res'),
        cache: path.join(templateDir, 'cache'),
        cordovaJs: 'bin/templates/project/assets/www/cordova.js',
        cordovaJsSrc: 'cordova-js-src'
    };

    it('should exist', () => {
        expect(Api).toBeDefined();
    });

    describe('Api constructor', () => {
        it('should be ale to construct.', () => {
            expect(api).toBeDefined();
        });

        it('should have set platform as electron.', () => {
            expect(api.platform).toBe('electron');
        });

        it('should have set the root path.', () => {
            /**
             * In Unit Testing:
             *   The API file path is located in "cordova-electron/bin/templates/cordova".
             *   The expected path is the "cordova-electron/bin/templates" dir.
             *
             * In production:
             *   The API file path is actually located in "<project_dir>/platforms/electron/cordova".
             *   The expected path is "<project_dir>/platforms/electron" which is the electron's platform root dir
             */
            expect(api.root).toBe(templateDir);
        });

        it('should configure proper locations.', () => {
            expect(api.locations).toEqual(mockExpectedLocations);
        });
    });

    describe('getPlatformInfo method', () => {
        beforeEach(() => {
            // Mocking require that is called to get version.
            Api.__set__('require', () => {
                return '1.0.0';
            });
        });

        afterEach(() => {
            Api.__set__('require', apiRequire);
        });

        it('should return object containing platform information', () => {
            const actual = api.getPlatformInfo();
            const expected = {
                locations: mockExpectedLocations,
                root: templateDir,
                name: 'electron',
                version: '1.0.0',
                projectConfig: undefined
            };
            expect(actual).toEqual(expected);
        });
    });

    describe('prepare method', () => {
        const prepareSpy = jasmine.createSpy('prepare');
        beforeEach(() => {
            // Mocking require that is called to get version.
            Api.__set__('require', () => {
                return {
                    prepare: prepareSpy
                };
            });
        });

        afterEach(() => {
            Api.__set__('require', apiRequire);
        });

        it('should return object containing platform information', () => {
            api.prepare('', {});
            expect(prepareSpy).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Object));
        });
    });

    /**
     * @todo Add useful tests.
     */
    describe('addPlugin method', () => {
        it('should reject when missing plugin information', () => {
            api.addPlugin().then(
                () => {},
                (error) => {
                    expect(error).toEqual(new Error('The parameter is incorrect. The first parameter should be valid PluginInfo instance'));
                }
            );
        });
    });

    /**
     * @todo Add useful tests.
     */
    describe('removePlugin method', () => {
        it('should exist', () => {
            expect(api.removePlugin).toBeDefined();
            expect(typeof api.removePlugin).toBe('function');
        });
    });

    /**
     * @todo Add useful test or drop and accept coveage from the parent method call (addPlugin & removePlugin).
     */
    describe('_getInstaller method', () => {
        it('should exist', () => {
            expect(api._getInstaller).toBeDefined();
        });
    });

    /**
     * @todo Add useful test or drop and accept coveage from the parent method call (addPlugin & removePlugin).
     */
    describe('_getUninstaller method', () => {
        it('should exist', () => {
            expect(api._getUninstaller).toBeDefined();
        });
    });

    /**
     * @todo Add useful test or drop and accept coveage from the parent method call (addPlugin).
     */
    describe('_addModulesInfo method', () => {
        it('should exist', () => {
            expect(api._addModulesInfo).toBeDefined();
        });
    });

    /**
     * @todo Add useful test or drop and accept coveage from the parent method call (addPlugin & removePlugin).
     */
    describe('_writePluginModules method', () => {
        it('should exist', () => {
            expect(api._writePluginModules).toBeDefined();
        });
    });

    /**
     * @todo Add useful test or drop and accept coveage from the parent method call (removePlugin).
     */
    describe('_removeModulesInfo method', () => {
        it('should exist', () => {
            expect(api._removeModulesInfo).toBeDefined();
        });
    });

    describe('updatePlatform method', () => {
        it('should return a resolved promise.', () => {
            Api.updatePlatform().then(
                (result) => {
                    // Currently updatePlatform only resolves with nothing.
                    expect(result).toBeUndefined();
                }
            );
        });
    });

    describe('createPlatform method', () => {
        beforeEach(() => {
            fs.removeSync(tmpDir);
        });

        afterEach(() => {
            fs.removeSync(tmpDir);
        });

        /**
         * @todo improve createPlatform to test actual created platforms.
         */
        it('should export static createPlatform function', () => {
            Api.createPlatform(tmpDir).then(
                (results) => {
                    expect(results.constructor.name).toBe(api.constructor.name);
                }
            );
        });

        it('should emit createPlatform not callable when error occurs.', () => {
            Api.__set__('require', () => {
                return {
                    createProject: () => { throw 'Some Random Error'; }
                };
            });

            expect(() => Api.createPlatform(tmpDir)).toThrowError(/createPlatform is not callable from the electron project API/);

            Api.__set__('require', apiRequire);
        });
    });

    describe('build method', () => {
        const runSpy = jasmine.createSpy('run');
        beforeEach(() => {
            // Mocking require that is called to get version.
            Api.__set__('require', () => {
                return {
                    run: { call: runSpy }
                };
            });
        });

        afterEach(() => {
            Api.__set__('require', apiRequire);
        });

        it('should execute build', () => {
            const mockBuildOptions = { foo: 'bar' };
            api.build(mockBuildOptions);
            expect(runSpy).toHaveBeenCalledWith(api, mockBuildOptions, api);
        });
    });

    describe('run method', () => {
        const runSpy = jasmine.createSpy('run');
        beforeEach(() => {
            // Mocking require that is called to get version.
            Api.__set__('require', () => {
                return {
                    run: runSpy
                };
            });
        });

        afterEach(() => {
            Api.__set__('require', apiRequire);
        });

        it('should execute run', () => {
            const mockRunOptions = { foo: 'bar' };
            api.run(mockRunOptions);
            expect(runSpy).toHaveBeenCalledWith(mockRunOptions);
        });
    });

    describe('clean method', () => {
        const cleanSpy = jasmine.createSpy('clean');
        beforeEach(() => {
            // Mocking require that is called to get version.
            Api.__set__('require', () => {
                return {
                    run: cleanSpy
                };
            });
        });

        afterEach(() => {
            Api.__set__('require', apiRequire);
        });

        it('should execute clean', () => {
            const mockCleanOptions = { foo: 'bar' };
            api.clean(mockCleanOptions);
            expect(cleanSpy).toHaveBeenCalledWith(mockCleanOptions);
        });
    });

    describe('requirements method', () => {
        const requirementsSpy = jasmine.createSpy('requirements');
        beforeEach(() => {
            // Mocking require that is called to get version.
            Api.__set__('require', () => {
                return {
                    run: requirementsSpy
                };
            });
        });

        afterEach(() => {
            Api.__set__('require', apiRequire);
        });

        it('should execute requirements', () => {
            api.requirements();
            expect(requirementsSpy).toHaveBeenCalled();
        });
    });
});
