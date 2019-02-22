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
const tmpDir = path.join(__dirname, '../../../temp');
const tmpWorkDir = path.join(tmpDir, 'work');
const apiRequire = Api.__get__('require');
const FIXTURES = path.join(__dirname, '..', 'fixtures');
const pluginFixture = path.join(FIXTURES, 'testplugin');
const testProjectDir = path.join(tmpDir, 'testapp');

function copyTestProject () {
    fs.ensureDirSync(tmpDir);
    fs.copySync(path.resolve(FIXTURES, 'testapp'), path.resolve(tmpDir, 'testapp'));
}

function dirExists (dir) {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

function fileExists (file) {
    return fs.existsSync(file) && fs.statSync(file).isFile();
}

function readJson (file) {
    return JSON.parse(
        fs.readFileSync(
            file
        )
    );
}

function writeJson (file, json) {
    fs.writeFileSync(
        file,
        JSON.stringify(json, null, '  '),
        'utf-8'
    );
}

describe('Api class', () => {
    fs.removeSync(tmpDir);
    fs.ensureDirSync(tmpWorkDir);
    copyTestProject();

    const api = new Api(null, testProjectDir);
    const apiEvents = Api.__get__('selfEvents');
    apiEvents.removeAllListeners();

    const rootDir = testProjectDir;
    const mockExpectedLocations = {
        platformRootDir: rootDir,
        root: rootDir,
        www: path.join(rootDir, 'www'),
        res: path.join(rootDir, 'res'),
        platformWww: path.join(rootDir, 'platform_www'),
        configXml: path.join(rootDir, 'config.xml'),
        defaultConfigXml: path.join(rootDir, 'cordova/defaults.xml'),
        build: path.join(rootDir, 'build'),
        buildRes: path.join(rootDir, 'build-res'),
        cache: path.join(rootDir, 'cache'),
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
            expect(api.root).toBe(rootDir);
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
                root: rootDir,
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

    describe('addPlugin method', () => {
        let logs = {};
        beforeEach(() => {
            fs.removeSync(path.resolve(testProjectDir, 'electron.json'));
            fs.removeSync(path.resolve(testProjectDir, 'www'));
            apiEvents.addListener('verbose', (data) => {
                logs.verbose.push(data);
            });
            logs = {
                verbose: []
            };
        });

        afterEach(() => {
            apiEvents.removeAllListeners();
        });

        it('should reject when missing plugin information', () => {
            api.addPlugin().then(
                () => {
                    fail('Unwanted code branch');
                },
                (error) => {
                    expect(error).toEqual(new Error('The parameter is incorrect. The first parameter should be valid PluginInfo instance'));
                }
            );
        });

        it('empty plugin', () => api.addPlugin({
            id: 'empty_plugin',
            getPlatformsArray: () => { return ['electron']; },
            getFilesAndFrameworks: (platform) => { return []; },
            getAssets: (platform) => { return []; },
            getJsModules: (platform) => { return []; },
            getConfigFiles: (platform) => { return []; }
        }, { }).then(
            (result) => {
                expect(result).not.toBeDefined();
                expect(dirExists(path.resolve(testProjectDir, 'www'))).toBeTruthy();
                expect(fileExists(path.resolve(testProjectDir, 'electron.json'))).toBeTruthy();
                expect(fileExists(path.resolve(testProjectDir, 'www', 'cordova_plugins.js'))).toBeTruthy();
            },
            (error) => {
                fail('Unwanted code branch: ' + error);
            }
        ));

        it('asset plugin', () => api.addPlugin({
            id: 'asset-plugin',
            dir: pluginFixture,
            getPlatformsArray: () => { return ['electron']; },
            getFilesAndFrameworks: (platform) => { return []; },
            getAssets: (platform) => {
                return [{
                    itemType: 'asset',
                    src: 'src/electron/sample.json',
                    target: 'js/sample.json'
                }];
            },
            getJsModules: (platform) => { return []; },
            getConfigFiles: (platform) => { return []; }
        }, { }).then(
            (result) => {
                expect(result).not.toBeDefined();
                expect(fileExists(path.resolve(testProjectDir, 'www', 'js', 'sample.json'))).toBeTruthy();
                expect(readJson(path.resolve(testProjectDir, 'www', 'js', 'sample.json')).title).toEqual('sample');
            },
            (error) => {
                fail('Unwanted code branch: ' + error);
            }
        ));

        it('js-module plugin', () => api.addPlugin({
            id: 'module-plugin',
            dir: pluginFixture,
            getPlatformsArray: () => { return ['electron']; },
            getFilesAndFrameworks: (platform) => { return []; },
            getAssets: (platform) => { return []; },
            getJsModules: (platform) => {
                return [{
                    itemType: 'js-module',
                    name: 'testmodule',
                    src: 'www/plugin.js',
                    clobbers: [ 'ModulePlugin.clobbers' ],
                    merges: [ 'ModulePlugin.merges' ],
                    runs: true
                }];
            },
            getConfigFiles: (platform) => { return []; }
        }, { }).then(
            (result) => {
                expect(result).not.toBeDefined();
                expect(fileExists(path.resolve(testProjectDir, 'www', 'plugins', 'module-plugin', 'www', 'plugin.js'))).toBeTruthy();
            },
            (error) => {
                fail('Unwanted code branch: ' + error);
            }
        ));

        it('unrecognized type plugin', () => {
            const _events = api.events;
            const emitSpy = jasmine.createSpy('emit');
            api.events = {
                emit: emitSpy
            };

            return api.addPlugin({
                id: 'unrecognized-plugin',
                dir: pluginFixture,
                getPlatformsArray: () => { return ['electron']; },
                getFilesAndFrameworks: (platform) => { return []; },
                getAssets: (platform) => {
                    return [{
                        itemType: 'unrecognized'
                    }];
                },
                getJsModules: (platform) => { return []; },
                getConfigFiles: (platform) => { return []; }
            }, { }).then(
                (result) => {
                    expect(emitSpy.calls.argsFor(0)[1]).toContain('unrecognized');
                    expect(result).not.toBeDefined();
                    api.events = _events;
                },
                (error) => {
                    fail('Unwanted code branch: ' + error);
                    api.events = _events;
                }
            );
        });

        it('source-file type plugin', () => api.addPlugin({
            id: 'source-file-plugin',
            dir: pluginFixture,
            getPlatformsArray: () => { return ['electron']; },
            getFilesAndFrameworks: (platform) => { return []; },
            getAssets: (platform) => {
                return [{
                    itemType: 'source-file'
                }];
            },
            getJsModules: (platform) => { return []; },
            getConfigFiles: (platform) => { return []; }
        }, { }).then(
            (result) => {
                expect(result).not.toBeDefined();
                expect(logs.verbose.some((message) => { return message === 'source-file.install is currently not supported for electron'; })).toBeTruthy();
            },
            (error) => {
                fail('Unwanted code branch: ' + error);
            }
        ));

        it('empty plugin with browser platform', () => api.addPlugin({
            id: 'empty_plugin',
            getPlatformsArray: () => { return ['browser']; },
            getFilesAndFrameworks: (platform) => { return []; },
            getAssets: (platform) => { return []; },
            getJsModules: (platform) => { return []; },
            getConfigFiles: (platform) => { return []; }
        }, { }).then(
            (result) => {
                expect(result).not.toBeDefined();
                expect(dirExists(path.resolve(testProjectDir, 'www'))).toBeTruthy();
                expect(fileExists(path.resolve(testProjectDir, 'electron.json'))).toBeTruthy();
                expect(fileExists(path.resolve(testProjectDir, 'www', 'cordova_plugins.js'))).toBeTruthy();
            },
            (error) => {
                fail('Unwanted code branch: ' + error);
            }
        ));
    });

    /**
     * @todo Add useful tests.
     */
    describe('removePlugin method', () => {
        let logs = {};
        beforeEach(() => {
            fs.removeSync(path.resolve(testProjectDir, 'electron.json'));
            fs.removeSync(path.resolve(testProjectDir, 'www'));
            apiEvents.addListener('verbose', (data) => {
                logs.verbose.push(data);
            });
            logs = {
                verbose: []
            };
        });

        afterEach(() => {
            apiEvents.removeAllListeners();
        });

        it('should exist', () => {
            expect(api.removePlugin).toBeDefined();
            expect(typeof api.removePlugin).toBe('function');
        });

        it('remove empty plugin', () => api.removePlugin({
            id: 'empty_plugin',
            getPlatformsArray: () => { return ['electron']; },
            getFilesAndFrameworks: (platform) => { return []; },
            getAssets: (platform) => { return []; },
            getJsModules: (platform) => { return []; },
            getConfigFiles: (platform) => { return []; }
        }, { }).then(
            (result) => {
                expect(result).not.toBeDefined();
            },
            (error) => {
                fail('Unwanted code branch: ' + error);
            }
        ));

        it('asset plugin', () => {
            fs.ensureDirSync(path.resolve(testProjectDir, 'www', 'js'));
            writeJson(path.resolve(testProjectDir, 'www', 'js', 'sample.json'), { 'title': 'sample' });
            return api.removePlugin({
                id: 'empty_plugin',
                dir: pluginFixture,
                getPlatformsArray: () => { return ['electron']; },
                getFilesAndFrameworks: (platform) => { return []; },
                getAssets: (platform) => {
                    return [{
                        itemType: 'asset',
                        src: 'src/electron/sample.json',
                        target: 'js/sample.json'
                    }];
                },
                getJsModules: (platform) => { return []; },
                getConfigFiles: (platform) => { return []; }
            }, { }).then(
                (result) => {
                    expect(result).not.toBeDefined();
                    expect(fileExists(path.resolve(testProjectDir, 'www', 'js', 'sample.json'))).toBeFalsy();
                },
                (error) => {
                    fail('Unwanted code branch: ' + error);
                }
            );
        });

        it('js-module plugin', () => {
            fs.ensureDirSync(path.resolve(testProjectDir, 'www', 'plugins', 'module-plugin', 'www'));
            fs.copySync(path.resolve(pluginFixture, 'www', 'plugin.js'), path.resolve(testProjectDir, 'www', 'plugins', 'module-plugin', 'www', 'plugin.js'));
            expect(fileExists(path.resolve(testProjectDir, 'www', 'plugins', 'module-plugin', 'www', 'plugin.js'))).toBeTruthy();
            return api.removePlugin({
                id: 'module-plugin',
                dir: pluginFixture,
                getPlatformsArray: () => { return ['electron']; },
                getFilesAndFrameworks: (platform) => { return []; },
                getAssets: (platform) => { return []; },
                getJsModules: (platform) => {
                    return [{
                        itemType: 'js-module',
                        name: 'testmodule',
                        src: 'www/plugin.js',
                        clobbers: [ 'ModulePlugin.clobbers' ],
                        merges: [ 'ModulePlugin.merges' ],
                        runs: true
                    }];
                },
                getConfigFiles: (platform) => { return []; }
            }, { }).then(
                (result) => {
                    expect(result).not.toBeDefined();
                    expect(fileExists(path.resolve(testProjectDir, 'www', 'plugins', 'module-plugin', 'www', 'plugin.js'))).toBeFalsy();
                },
                (error) => {
                    fail('Unwanted code branch: ' + error);
                }
            );
        });

        it('unrecognized type plugin', () => api.removePlugin({
            id: 'unrecognized-plugin',
            dir: pluginFixture,
            getPlatformsArray: () => { return ['electron']; },
            getFilesAndFrameworks: (platform) => { return []; },
            getAssets: (platform) => {
                return [{
                    itemType: 'unrecognized'
                }];
            },
            getJsModules: (platform) => { return []; },
            getConfigFiles: (platform) => { return []; }
        }, { }).then(
            (result) => {
                expect(result).not.toBeDefined();
            },
            (error) => {
                fail('Unwanted code branch: ' + error);
            }
        ));

        it('source-file type plugin', () => api.removePlugin({
            id: 'source-file-plugin',
            dir: pluginFixture,
            getPlatformsArray: () => { return ['electron']; },
            getFilesAndFrameworks: (platform) => { return []; },
            getAssets: (platform) => {
                return [{
                    itemType: 'source-file'
                }];
            },
            getJsModules: (platform) => { return []; },
            getConfigFiles: (platform) => { return []; }
        }, { }).then(
            (result) => {
                expect(result).not.toBeDefined();
                expect(logs.verbose.some((message) => { return message === 'source-file.uninstall is currently not supported for electron'; })).toBeTruthy();
            },
            (error) => {
                fail('Unwanted code branch: ' + error);
            }
        ));

        it('remove empty plugin with browser platform', () => api.removePlugin({
            id: 'empty_plugin',
            getPlatformsArray: () => { return ['browser']; },
            getFilesAndFrameworks: (platform) => { return []; },
            getAssets: (platform) => { return []; },
            getJsModules: (platform) => { return []; },
            getConfigFiles: (platform) => { return []; }
        }, { }).then(
            (result) => {
                expect(result).not.toBeDefined();
            },
            (error) => {
                fail('Unwanted code branch: ' + error);
            }
        ));

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
            fs.removeSync(tmpWorkDir);
        });

        afterEach(() => {
            fs.removeSync(tmpWorkDir);
        });

        /**
         * @todo improve createPlatform to test actual created platforms.
         */
        it('should export static createPlatform function', () => {
            return Api.createPlatform(tmpWorkDir).then(
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

            expect(() => Api.createPlatform(tmpWorkDir)).toThrowError(/createPlatform is not callable from the electron project API/);

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
