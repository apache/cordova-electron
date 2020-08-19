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
const path = require('path');
const fs = require('fs-extra');
const CordovaError = require('cordova-common').CordovaError;

const rootDir = path.resolve(__dirname, '../../../..');
const fixturesDir = path.join(rootDir, 'tests/spec/fixtures');
const tmpDir = path.join(rootDir, 'temp');
const testProjectDir = path.join(tmpDir, 'testapp');

const Api = require(path.join(rootDir, 'bin/templates/cordova/Api'));
let prepare;

/**
 * Create a mock item from the getIcon and getSplashScreens collections with the supplied updated data.
 *
 * @param {Object} data Changes to apply to the mock getIcon item
 */
function mockGetImageItem (data) {
    return Object.assign({}, {
        src: undefined,
        target: undefined,
        density: undefined,
        platform: 'electron',
        width: undefined,
        height: undefined,
        background: undefined,
        foreground: undefined
    }, data);
}

const defaultMockProjectPackageJson = `{
    "name": "io.cordova.electronTest",
    "displayName": "electronTest",
    "version": "1.0.0",
    "description": "A Sample Apache Cordova Electron Application.",
    "author": "Apache Cordova Team",
    "license": "Apache-2.0",
    "dependencies": { "cordova-electron": "^1.0.2" },
    "devDependencies": {},
    "cordova": { 
        "plugins": {},
        "platforms": ["electron"]
    }
}`;

const cordovaProjectDefault = {
    root: 'MOCK_PROJECT_ROOT',
    projectConfig: {
        path: path.join('MOCK_PROJECT_ROOT', 'config.xml'),
        cdvNamespacePrefix: 'cdv',
        doc: {
            getroot: function () {
                return this;
            },
            find: function (path) {
                path = {
                    attrib: { src: '' }
                };
                return path;
            },
            findall: function (path) {
                path = [
                    {
                        attrib: { name: 'SplashScreen', value: '' }
                    },
                    {
                        attrib: { name: '', value: '' }
                    }
                ];
                return path;
            }
        },
        write: function () {
            return this;
        }
    },
    locations: {
        buildRes: path.join('MOCK_PROJECT_ROOT', 'build-res'),
        www: path.join('MOCK_PROJECT_ROOT', 'www'),
        configXml: path.join('MOCK_PROJECT_ROOT', 'config.xml'),
        platformRootDir: path.join('MOCK_PROJECT_ROOT', 'platform_www')
    }
};

const locationsDefault = cordovaProjectDefault.locations;

let fakeParserConstructorSpy;
let fakeManifestJsonParserConfigureSpy;
let fakePackageJsonParserConfigureSpy;
let fakePackageJsonParserEnableDevToolsSpy;
let fakeSettingJsonParserConfigureSpy;
let fakeParserWriteSpy;
let fakeConfigParserConstructorSpy;
let fakeConfigParserWriteSpy;
let mergeXmlSpy;
let updateIconsSpy;
let updateSplashScreensSpy;
let emitSpy;
let xmlHelpersMock;
let updateIconsFake;
let updateSplashScreensFake;

function createSpies () {
    fakeParserConstructorSpy = jasmine.createSpy('fakeParserConstructorSpy');

    fakeManifestJsonParserConfigureSpy = jasmine.createSpy('fakeManifestJsonParserConfigureSpy');
    fakePackageJsonParserConfigureSpy = jasmine.createSpy('fakePackageJsonParserConfigureSpy');
    fakePackageJsonParserEnableDevToolsSpy = jasmine.createSpy('fakePackageJsonParserEnableDevToolsSpy');
    fakeSettingJsonParserConfigureSpy = jasmine.createSpy('fakeSettingJsonParserConfigureSpy');

    fakeParserWriteSpy = jasmine.createSpy('fakeParserWriteSpy');

    fakeConfigParserConstructorSpy = jasmine.createSpy('fakeConfigParserConstructorSpy');
    fakeConfigParserWriteSpy = jasmine.createSpy('fakeConfigParserWriteSpy');
    mergeXmlSpy = jasmine.createSpy('mergeXmlSpy');
    updateIconsSpy = jasmine.createSpy('updateIconsSpy');
    updateSplashScreensSpy = jasmine.createSpy('updateSplashScreensSpy');
    emitSpy = jasmine.createSpy('emitSpy');

    prepare = rewire(path.join(rootDir, 'lib/prepare'));

    prepare.__set__('events', {
        emit: emitSpy
    });

    xmlHelpersMock = {
        mergeXml: function () {
            mergeXmlSpy();
            return this;
        }
    };

    updateIconsFake = () => {
        updateIconsSpy();
        return this;
    };

    updateSplashScreensFake = () => {
        updateSplashScreensSpy();
        return this;
    };
}

// define fake classses, methods and variables
class FakeParser {
    constructor () {
        fakeParserConstructorSpy();
    }

    write () {
        fakeParserWriteSpy();
        return this;
    }
}

class FakeManifestJsonParser extends FakeParser {
    configure (configXmlParser) {
        fakeManifestJsonParserConfigureSpy(configXmlParser);
        return this;
    }
}

class FakePackageJsonParser extends FakeParser {
    configure (configXmlParser, projectPackageJson) {
        fakePackageJsonParserConfigureSpy(configXmlParser, projectPackageJson);
        return this;
    }

    enableDevTools (enable) {
        fakePackageJsonParserEnableDevToolsSpy(enable);
        return this;
    }
}

class FakeSettingJsonParser extends FakeParser {
    configure (configXmlParser, options, userElectronFile) {
        fakeSettingJsonParserConfigureSpy(configXmlParser, options, userElectronFile);
        return this;
    }
}

class FakeConfigParser {
    constructor () {
        this.doc = {
            getroot: function () {
                return this;
            }
        };
        fakeConfigParserConstructorSpy();
    }

    write () {
        fakeConfigParserWriteSpy();
        return this;
    }
}

describe('Testing prepare.js:', () => {
    describe('module.exports.prepare method', () => {
        // define spies
        let updatePathsSpy;
        let cordovaProject;
        let api;

        beforeAll(() => {
            fs.ensureDirSync(tmpDir);
            fs.copySync(path.resolve(fixturesDir, 'testapp'), path.resolve(tmpDir, 'testapp'));
            api = new Api(null, testProjectDir);
        });

        afterAll(() => {
            fs.removeSync(tmpDir);
        });

        beforeEach(() => {
            createSpies();
            cordovaProject = Object.assign({}, cordovaProjectDefault);

            updatePathsSpy = jasmine.createSpy('updatePaths');
            prepare.__set__('FileUpdater', {
                updatePaths: updatePathsSpy
            });
        });

        it('should generate config.xml from defaults for platform.', () => {
            // Mocking the scope with dummy API;
            return Promise.resolve().then(function () {
                // Create API instance and mock for test case.
                api.events = { emit: emitSpy };
                api.parser.update_www = () => this;
                api.parser.update_project = () => this;

                const defaultConfigPathMock = path.join(api.locations.platformRootDir, 'cordova', 'defaults.xml');
                const ownConfigPathMock = api.locations.configXml;

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (configPath) {
                        return configPath === defaultConfigPathMock;
                    },
                    copySync: copySyncSpy,
                    readFileSync: function (filePath) {
                        if (filePath === path.join('MOCK_PROJECT_ROOT', 'package.json')) {
                            return defaultMockProjectPackageJson;
                        }
                    }
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('updateSplashScreens', updateSplashScreensFake);
                prepare.__set__('ManifestJsonParser', FakeManifestJsonParser);
                prepare.__set__('PackageJsonParser', FakePackageJsonParser);
                prepare.__set__('SettingJsonParser', FakeSettingJsonParser);

                cordovaProject.projectConfig.getPlatformPreference = () => undefined;

                prepare.prepare.call(api, cordovaProject, { }, api);

                expect(copySyncSpy).toHaveBeenCalledWith(defaultConfigPathMock, ownConfigPathMock);
                expect(mergeXmlSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(updateSplashScreensSpy).toHaveBeenCalled();
                expect(fakeParserConstructorSpy).toHaveBeenCalled();
                expect(fakeConfigParserConstructorSpy).toHaveBeenCalled();
                expect(fakeManifestJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserEnableDevToolsSpy).toHaveBeenCalled();
                expect(fakeSettingJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakeParserWriteSpy).toHaveBeenCalled();
                expect(fakeConfigParserWriteSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'Generating config.xml';
                expect(actual).toContain(expected);
            });
        });

        it('should enable devtools.', () => {
            // Mocking the scope with dummy API;
            return Promise.resolve().then(function () {
                // Create API instance and mock for test case.
                api.events = { emit: emitSpy };
                api.parser.update_www = () => this;
                api.parser.update_project = () => this;

                const defaultConfigPathMock = path.join(api.locations.platformRootDir, 'cordova', 'defaults.xml');

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (configPath) {
                        return configPath === defaultConfigPathMock;
                    },
                    copySync: copySyncSpy,
                    readFileSync: function (filePath) {
                        if (filePath === path.join('MOCK_PROJECT_ROOT', 'package.json')) {
                            return defaultMockProjectPackageJson;
                        }
                    }
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('updateSplashScreens', updateSplashScreensFake);
                prepare.__set__('ManifestJsonParser', FakeManifestJsonParser);
                prepare.__set__('PackageJsonParser', FakePackageJsonParser);
                prepare.__set__('SettingJsonParser', FakeSettingJsonParser);

                cordovaProject.projectConfig.getPlatformPreference = () => undefined;

                prepare.prepare.call(
                    api,
                    cordovaProject,
                    {
                        options: {
                            release: false
                        }
                    },
                    api
                );

                expect(fakePackageJsonParserEnableDevToolsSpy).toHaveBeenCalledWith(true);
            });
        });

        it('should not enable devtools.', () => {
            // Mocking the scope with dummy API;
            return Promise.resolve().then(function () {
                // Create API instance and mock for test case.
                api.events = { emit: emitSpy };
                api.parser.update_www = () => this;
                api.parser.update_project = () => this;

                const defaultConfigPathMock = path.join(api.locations.platformRootDir, 'cordova', 'defaults.xml');

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (configPath) {
                        return configPath === defaultConfigPathMock;
                    },
                    copySync: copySyncSpy,
                    readFileSync: function (filePath) {
                        if (filePath === path.join('MOCK_PROJECT_ROOT', 'package.json')) {
                            return defaultMockProjectPackageJson;
                        }
                    }
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('updateSplashScreens', updateSplashScreensFake);
                prepare.__set__('ManifestJsonParser', FakeManifestJsonParser);
                prepare.__set__('PackageJsonParser', FakePackageJsonParser);
                prepare.__set__('SettingJsonParser', FakeSettingJsonParser);

                cordovaProject.projectConfig.getPlatformPreference = () => undefined;

                prepare.prepare.call(
                    api,
                    cordovaProject,
                    {
                        options: {
                            release: true
                        }
                    },
                    api
                );

                expect(fakePackageJsonParserEnableDevToolsSpy).toHaveBeenCalledWith(false);
            });
        });

        it('should get user supplied Electron settings overide path from config.xml but ignore for incorrect path.', () => {
            // Mocking the scope with dummy API;
            return Promise.resolve().then(function () {
                // Create API instance and mock for test case.
                api.events = { emit: emitSpy };
                api.parser.update_www = () => this;
                api.parser.update_project = () => this;

                const defaultConfigPathMock = path.join(api.locations.platformRootDir, 'cordova', 'defaults.xml');

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (configPath) {
                        if (configPath === defaultConfigPathMock) return true;
                        if (configPath.includes('fail_test_path')) return false;
                    },
                    copySync: copySyncSpy,
                    readFileSync: function (filePath) {
                        if (filePath === path.join('MOCK_PROJECT_ROOT', 'package.json')) {
                            return defaultMockProjectPackageJson;
                        }
                    }
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('updateSplashScreens', updateSplashScreensFake);
                prepare.__set__('ManifestJsonParser', FakeManifestJsonParser);
                prepare.__set__('PackageJsonParser', FakePackageJsonParser);
                prepare.__set__('SettingJsonParser', FakeSettingJsonParser);

                cordovaProject.projectConfig.getPlatformPreference = (name, platform) => 'fail_test_path';

                prepare.prepare.call(api, cordovaProject, { }, api);

                expect(fakeManifestJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserEnableDevToolsSpy).toHaveBeenCalled();
                expect(fakeSettingJsonParserConfigureSpy).toHaveBeenCalled();
                const actual = fakeSettingJsonParserConfigureSpy.calls.argsFor(0)[1];
                expect(actual).toEqual(undefined);
            });
        });

        it('should get valid user supplied Electron settings overide path from config.xml.', () => {
            // Mocking the scope with dummy API;
            return Promise.resolve().then(function () {
                // Create API instance and mock for test case.
                api.events = { emit: emitSpy };
                api.parser.update_www = () => this;
                api.parser.update_project = () => this;

                const defaultConfigPathMock = path.join(api.locations.platformRootDir, 'cordova', 'defaults.xml');
                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (configPath) {
                        if (configPath === defaultConfigPathMock) return true;
                        if (configPath.includes('pass_test_path')) return true;
                    },
                    copySync: copySyncSpy,
                    readFileSync: function (filePath) {
                        if (filePath === path.join('MOCK_PROJECT_ROOT', 'package.json')) {
                            return defaultMockProjectPackageJson;
                        }
                    }
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('updateSplashScreens', updateSplashScreensFake);
                prepare.__set__('ManifestJsonParser', FakeManifestJsonParser);
                prepare.__set__('PackageJsonParser', FakePackageJsonParser);
                prepare.__set__('SettingJsonParser', FakeSettingJsonParser);

                cordovaProject.projectConfig.getPlatformPreference = (name, platform) => 'pass_test_path';

                prepare.prepare.call(api, cordovaProject, { }, api);

                expect(fakeManifestJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserEnableDevToolsSpy).toHaveBeenCalled();
                expect(fakeSettingJsonParserConfigureSpy).toHaveBeenCalled();
                const actual = fakeSettingJsonParserConfigureSpy.calls.argsFor(0)[2];
                expect(actual).toContain('pass_test_path');
            });
        });

        it('should generate defaults.xml from own config.xml for platform.', () => {
            // Mocking the scope with dummy API;
            return Promise.resolve().then(function () {
                // Create API instance and mock for test case.
                api.events = { emit: emitSpy };
                api.parser.update_www = () => this;
                api.parser.update_project = () => this;

                const defaultConfigPathMock = path.join(api.locations.platformRootDir, 'cordova', 'defaults.xml');
                const ownConfigPathMock = api.locations.configXml;

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (configPath) {
                        return configPath === ownConfigPathMock;
                    },
                    copySync: copySyncSpy,
                    readFileSync: function (filePath) {
                        if (filePath === path.join('MOCK_PROJECT_ROOT', 'package.json')) {
                            return defaultMockProjectPackageJson;
                        }
                    }
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('updateSplashScreens', updateSplashScreensFake);
                prepare.__set__('ManifestJsonParser', FakeManifestJsonParser);
                prepare.__set__('PackageJsonParser', FakePackageJsonParser);
                prepare.__set__('SettingJsonParser', FakeSettingJsonParser);

                cordovaProject.projectConfig.getPlatformPreference = () => undefined;

                prepare.prepare.call(api, cordovaProject, { }, api);

                expect(copySyncSpy).toHaveBeenCalledWith(ownConfigPathMock, defaultConfigPathMock);
                expect(mergeXmlSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(updateSplashScreensSpy).toHaveBeenCalled();
                expect(fakeParserConstructorSpy).toHaveBeenCalled();
                expect(fakeConfigParserConstructorSpy).toHaveBeenCalled();
                expect(fakeManifestJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserEnableDevToolsSpy).toHaveBeenCalled();
                expect(fakeSettingJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakeParserWriteSpy).toHaveBeenCalled();
                expect(fakeConfigParserWriteSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'Generating defaults.xml';
                expect(actual).toContain(expected);
            });
        });

        it('should hit case 3.', () => {
            // Mocking the scope with dummy API;
            return Promise.resolve().then(function () {
                // Create API instance and mock for test case.
                api.events = { emit: emitSpy };
                api.parser.update_www = () => this;
                api.parser.update_project = () => this;

                const defaultConfigPathMock = path.join(api.locations.platformRootDir, 'cordova', 'defaults.xml');
                const ownConfigPathMock = api.locations.configXml;
                const sourceCfgMock = cordovaProject.projectConfig;

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (configPath) {
                        return configPath !== ownConfigPathMock && configPath !== defaultConfigPathMock;
                    },
                    copySync: copySyncSpy,
                    readFileSync: function (filePath) {
                        if (filePath === path.join('MOCK_PROJECT_ROOT', 'package.json')) {
                            return defaultMockProjectPackageJson;
                        }
                    }
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('updateSplashScreens', updateSplashScreensFake);
                prepare.__set__('ManifestJsonParser', FakeManifestJsonParser);
                prepare.__set__('PackageJsonParser', FakePackageJsonParser);
                prepare.__set__('SettingJsonParser', FakeSettingJsonParser);

                cordovaProject.projectConfig.getPlatformPreference = () => undefined;

                prepare.prepare.call(api, cordovaProject, { }, api);

                expect(copySyncSpy).toHaveBeenCalledWith(sourceCfgMock.path, ownConfigPathMock);
                expect(mergeXmlSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(updateSplashScreensSpy).toHaveBeenCalled();
                expect(fakeParserConstructorSpy).toHaveBeenCalled();
                expect(fakeConfigParserConstructorSpy).toHaveBeenCalled();
                expect(fakeManifestJsonParserConfigureSpy).not.toHaveBeenCalled();
                expect(fakePackageJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserEnableDevToolsSpy).toHaveBeenCalled();
                expect(fakeSettingJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakeParserWriteSpy).toHaveBeenCalled();
                expect(fakeConfigParserWriteSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'case 3';
                expect(actual).toContain(expected);
            });
        });

        it('should copy manifest.', () => {
            // Mocking the scope with dummy API;
            return Promise.resolve().then(function () {
                // Create API instance and mock for test case.
                api.events = { emit: emitSpy };
                api.parser.update_www = () => this;
                api.parser.update_project = () => this;

                const srcManifestPathMock = path.join(cordovaProject.locations.www, 'manifest.json');
                const manifestPathMock = path.join(api.locations.www, 'manifest.json');

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (srcManifestPath) {
                        return srcManifestPath === srcManifestPathMock;
                    },
                    copySync: copySyncSpy,
                    readFileSync: function (filePath) {
                        if (filePath === path.join('MOCK_PROJECT_ROOT', 'package.json')) {
                            return defaultMockProjectPackageJson;
                        }
                    }
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('updateSplashScreens', updateSplashScreensFake);
                prepare.__set__('ManifestJsonParser', FakeManifestJsonParser);
                prepare.__set__('PackageJsonParser', FakePackageJsonParser);
                prepare.__set__('SettingJsonParser', FakeSettingJsonParser);

                cordovaProject.projectConfig.getPlatformPreference = () => undefined;

                prepare.prepare.call(api, cordovaProject, { }, api);

                expect(copySyncSpy).toHaveBeenCalledWith(srcManifestPathMock, manifestPathMock);
                expect(mergeXmlSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(updateSplashScreensSpy).toHaveBeenCalled();
                expect(fakeParserConstructorSpy).toHaveBeenCalled();
                expect(fakeConfigParserConstructorSpy).toHaveBeenCalled();
                expect(fakeManifestJsonParserConfigureSpy).not.toHaveBeenCalled();
                expect(fakePackageJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserEnableDevToolsSpy).toHaveBeenCalled();
                expect(fakeSettingJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakeParserWriteSpy).toHaveBeenCalled();
                expect(fakeConfigParserWriteSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(1)[1];
                const expected = 'Copying';
                expect(actual).toContain(expected);
            });
        });

        it('should create new manifest file.', () => {
            // Mocking the scope with dummy API;
            return Promise.resolve().then(function () {
                // Create API instance and mock for test case.
                api.events = { emit: emitSpy };
                api.parser.update_www = () => this;
                api.parser.update_project = () => this;

                const srcManifestPathMock = path.join(cordovaProject.locations.www, 'manifest.json');

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (srcManifestPath) {
                        return srcManifestPath !== srcManifestPathMock;
                    },
                    copySync: copySyncSpy,
                    readFileSync: function (filePath) {
                        if (filePath === path.join('MOCK_PROJECT_ROOT', 'package.json')) {
                            return defaultMockProjectPackageJson;
                        }
                    }
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('updateSplashScreens', updateSplashScreensFake);
                prepare.__set__('ManifestJsonParser', FakeManifestJsonParser);
                prepare.__set__('PackageJsonParser', FakePackageJsonParser);
                prepare.__set__('SettingJsonParser', FakeSettingJsonParser);

                cordovaProject.projectConfig.getPlatformPreference = () => undefined;

                prepare.prepare.call(api, cordovaProject, { }, api);

                expect(mergeXmlSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(updateSplashScreensSpy).toHaveBeenCalled();
                expect(fakeParserConstructorSpy).toHaveBeenCalled();
                expect(fakeConfigParserConstructorSpy).toHaveBeenCalled();
                expect(fakeManifestJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakePackageJsonParserEnableDevToolsSpy).toHaveBeenCalled();
                expect(fakeSettingJsonParserConfigureSpy).toHaveBeenCalled();
                expect(fakeParserWriteSpy).toHaveBeenCalled();
                expect(fakeConfigParserWriteSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(1)[1];
                const expected = 'Creating';
                expect(actual).toContain(expected);
            });
        });
    });

    describe('updateSplashScreens method', () => {
        let cordovaProject;
        let config;
        let locations;

        beforeEach(() => {
            createSpies();
            cordovaProject = Object.assign({}, cordovaProjectDefault);
            config = Object.assign({}, cordovaProjectDefault.projectConfig);
            locations = Object.assign({}, locationsDefault);
        });

        it('should detect no defined splash screens.', () => {
            const updateSplashScreens = prepare.__get__('updateSplashScreens');

            cordovaProject.projectConfig.getSplashScreens = () => [];

            updateSplashScreens(cordovaProject, config, locations);

            // The emit was called
            expect(emitSpy).toHaveBeenCalled();

            // The emit message was.
            const actual = emitSpy.calls.argsFor(0)[1];
            const expected = 'This app does not have splash screens defined.';
            expect(actual).toEqual(expected);
        });

        it('should update splashScreen.', () => {
            const updateSplashScreens = prepare.__get__('updateSplashScreens');

            // create spies
            const prepareSplashScreensSpy = jasmine.createSpy('prepareSplashScreens');
            prepare.__set__('prepareSplashScreens', prepareSplashScreensSpy);
            const createResourceMapSpy = jasmine.createSpy('createResourceMap');
            prepare.__set__('createResourceMap', createResourceMapSpy);
            const updatePathToSplashScreenSpy = jasmine.createSpy('updatePathToSplashScreen');
            prepare.__set__('updatePathToSplashScreen', updatePathToSplashScreenSpy);
            const copyResourcesSpy = jasmine.createSpy('copyResources');
            prepare.__set__('copyResources', copyResourcesSpy);

            cordovaProject.projectConfig.getSplashScreens = () => {
                const splashScreen = mockGetImageItem({});
                return [splashScreen];
            };

            updateSplashScreens(cordovaProject, locations);

            // The emit was called
            expect(emitSpy).toHaveBeenCalled();
            expect(prepareSplashScreensSpy).toHaveBeenCalled();
            expect(createResourceMapSpy).toHaveBeenCalled();
            expect(updatePathToSplashScreenSpy).toHaveBeenCalled();
            expect(copyResourcesSpy).toHaveBeenCalled();

            // The emit message was.
            const actual = emitSpy.calls.argsFor(0)[1];
            const expected = 'Updating splash screens';
            expect(actual).toEqual(expected);
        });
    });

    describe('prepareSplashScreens method', () => {
        let prepareSplashScreens;

        beforeEach(() => {
            createSpies();
            prepareSplashScreens = prepare.__get__('prepareSplashScreens');
        });

        it('should return object with splashScreen image, when there is only splashScreen image in res/electron folder.', () => {
            const splash = mockGetImageItem({
                src: path.join('res', 'electron', 'splash.png'),
                platform: 'electron'
            });

            const actual = prepareSplashScreens([splash]);
            const expected = {
                splashScreen: Object.assign(splash, { extension: '.png' })
            };

            expect(expected).toEqual(actual);
        });

        it('should return object with the 2nd splashScreen image, when there two splashScreen images in res/electron folder.', () => {
            const splash = mockGetImageItem({
                src: path.join('res', 'electron', 'splash.png'),
                platform: 'electron'
            });
            const splash2 = mockGetImageItem({
                src: path.join('res', 'electron', 'splash2.png'),
                platform: 'electron'
            });

            let actual = prepareSplashScreens([splash, splash2]);
            let expected = {
                splashScreen: Object.assign(splash2, { extension: '.png' })
            };

            expect(expected).toEqual(actual);

            // The emit was called
            expect(emitSpy).toHaveBeenCalled();

            // The emit message was.
            actual = emitSpy.calls.argsFor(0)[1];
            expected = `Found extra splash screen image: ${path.join('res', 'electron', 'splash.png')} and ignoring in favor of ${path.join('res', 'electron', 'splash2.png')}.`;
            expect(actual).toEqual(expected);
        });
    });

    describe('updatePathToSplashScreen method', () => {
        let ConfigParser;
        let locations;
        let updatePathToSplashScreen;

        beforeEach(() => {
            createSpies();
            ConfigParser = Object.assign({}, cordovaProjectDefault.projectConfig);
            locations = Object.assign({}, locationsDefault);
            updatePathToSplashScreen = prepare.__get__('updatePathToSplashScreen');
        });

        it('should update splash screen location in config.xml', () => {
            const resourceMap = [
                {
                    [path.join('res', 'electron', 'splash.png')]: path.join('MOCK_PROJECT_ROOT', 'www', '.cdv', 'splashScreen.png')
                }
            ];

            updatePathToSplashScreen(ConfigParser, locations, resourceMap);

            const elementKeys = Object.keys(resourceMap[0]);
            const splashScreenPath = resourceMap[0][elementKeys];
            const splashScreenRelativePath = path.relative(locations.www, splashScreenPath);

            expect(path.join('MOCK_PROJECT_ROOT', 'www', '.cdv', 'splashScreen.png')).toEqual(splashScreenPath);
            expect(path.join('.cdv', 'splashScreen.png')).toEqual(splashScreenRelativePath);
        });
    });

    describe('updateIcons method', () => {
        let cordovaProject;
        let locations;

        beforeEach(() => {
            createSpies();
            cordovaProject = Object.assign({}, cordovaProjectDefault);
            locations = Object.assign({}, locationsDefault);
        });

        it('should detect no defined icons.', () => {
            const updateIcons = prepare.__get__('updateIcons');

            cordovaProject.projectConfig.getIcons = () => [];

            updateIcons(cordovaProject, locations);

            // The emit was called
            expect(emitSpy).toHaveBeenCalled();

            // The emit message was.
            const actual = emitSpy.calls.argsFor(0)[1];
            const expected = 'This app does not have icons defined';
            expect(actual).toEqual(expected);
        });

        it('should not update icons when required attributes are undefined.', () => {
            const updateIcons = prepare.__get__('updateIcons');

            // create spies
            const prepareIconsSpy = jasmine.createSpy('prepareIcons');
            prepare.__set__('prepareIcons', prepareIconsSpy);
            const createResourceMapSpy = jasmine.createSpy('createResourceMap');
            prepare.__set__('createResourceMap', createResourceMapSpy);
            const copyResourcesSpy = jasmine.createSpy('copyResources');
            prepare.__set__('copyResources', copyResourcesSpy);

            cordovaProject.projectConfig.getIcons = () => {
                const icon = mockGetImageItem({});
                return [icon];
            };

            expect(() => {
                updateIcons(cordovaProject, locations);
            }).toThrow(
                new CordovaError('No icon match the required size. Please ensure that ".png" icon is at least 512x512 and has a src attribute.')
            );

            expect(emitSpy).toHaveBeenCalled();
            expect(prepareIconsSpy).not.toHaveBeenCalled();
            expect(createResourceMapSpy).not.toHaveBeenCalled();
            expect(copyResourcesSpy).not.toHaveBeenCalled();
        });

        it('should update icons when required attributes are defined.', () => {
            const updateIcons = prepare.__get__('updateIcons');

            // create spies
            const prepareIconsSpy = jasmine.createSpy('prepareIcons');
            prepare.__set__('prepareIcons', prepareIconsSpy);
            const createResourceMapSpy = jasmine.createSpy('createResourceMap');
            prepare.__set__('createResourceMap', createResourceMapSpy);
            const copyResourcesSpy = jasmine.createSpy('copyResources');
            prepare.__set__('copyResources', copyResourcesSpy);

            cordovaProject.projectConfig.getIcons = () => {
                const icon = mockGetImageItem({
                    src: path.join('res', 'electron', 'cordova_512.png')
                });

                return [icon];
            };

            updateIcons(cordovaProject, locations);

            expect(prepareIconsSpy).toHaveBeenCalled();
            expect(createResourceMapSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalled();
            expect(copyResourcesSpy).toHaveBeenCalled();

            // The emit message was.
            const actual = emitSpy.calls.argsFor(0)[1];
            const expected = 'Updating icons';
            expect(actual).toEqual(expected);
        });
    });

    describe('checkIconsAttributes method', () => {
        let checkIconsAttributes;

        beforeEach(() => {
            createSpies();
            checkIconsAttributes = prepare.__get__('checkIconsAttributes');
        });

        it('should not emit info message.', () => {
            const icons = [
                mockGetImageItem({
                    src: path.join('res', 'electron', 'cordova_512.png'),
                    width: 512,
                    height: 512
                })
            ];

            icons.forEach(icon => {
                checkIconsAttributes(icon);

                expect(emitSpy).not.toHaveBeenCalled();
            });
        });

        it('should detect icons with missing src and emit info message.', () => {
            const icons = [
                mockGetImageItem({
                    src: ''
                })
            ];

            icons.forEach(icon => {
                checkIconsAttributes(icon);

                // The emit message was.
                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'The following icon with a size of width=undefined height=undefined does not meet the requirements and will be ignored.';
                expect(actual).toEqual(expected);
            });
        });

        it('should detect icons with missing src, but defined size and emit info message.', () => {
            const icons = [
                mockGetImageItem({
                    src: '',
                    width: 512,
                    height: 512
                })
            ];

            icons.forEach(icon => {
                checkIconsAttributes(icon);

                // The emit message was.
                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'The following icon with a size of width=512 height=512 does not meet the requirements and will be ignored.';
                expect(actual).toEqual(expected);
            });
        });

        it('should detect icons with target set, but missing src and emit info message.', () => {
            const icons = [
                mockGetImageItem({
                    src: '',
                    target: 'installer'
                })
            ];

            icons.forEach(icon => {
                checkIconsAttributes(icon);

                // The emit message was
                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'The following installer icon with a size of width=undefined height=undefined does not meet the requirements and will be ignored.';
                expect(actual).toEqual(expected);
            });
        });

        it('should detect icons with wrong size defined and emit info message.', () => {
            const icons = [
                mockGetImageItem({
                    src: path.join('res', 'electron', 'cordova_512.png'),
                    height: 512,
                    width: 256
                })
            ];

            icons.forEach(icon => {
                checkIconsAttributes(icon);

                // The emit message was.
                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'The following icon with a size of width=256 height=512 does not meet the requirements and will be ignored.';
                expect(actual).toEqual(expected);
            });
        });

        it('should detect icons with wrong size defined for the installer and emit info message.', () => {
            const icons = [
                mockGetImageItem({
                    src: path.join('res', 'electron', 'cordova_512.png'),
                    target: 'installer',
                    height: 256,
                    width: 256
                })
            ];

            icons.forEach(icon => {
                checkIconsAttributes(icon);

                // The emit message was.
                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'The following installer icon with a size of width=256 height=256 does not meet the requirements and will be ignored.';
                expect(actual).toEqual(expected);
            });
        });
    });

    describe('prepareIcons method', () => {
        let prepareIcons;

        beforeEach(() => {
            createSpies();
            prepareIcons = prepare.__get__('prepareIcons');
        });

        it('should return array of objects with custom icon, when there is only one icon in res folder.', () => {
            const icons = mockGetImageItem({
                src: path.join('res', 'logo.png'),
                platform: undefined
            });

            const actual = prepareIcons([icons]);
            const expected = {
                customIcon: Object.assign(icons, { extension: '.png' }),
                appIcon: undefined,
                installerIcon: undefined,
                highResIcons: []
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with custom icon, when there is only one icon in res/electron folder.', () => {
            const icons = mockGetImageItem({
                src: path.join('res', 'electron', 'logo.png')
            });

            const actual = prepareIcons([icons]);
            const expected = {
                customIcon: Object.assign(icons, { extension: '.png' }),
                appIcon: undefined,
                installerIcon: undefined,
                highResIcons: []
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with custom icons, when there is only one icon with correct width and height set.', () => {
            const icons = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                width: 512,
                height: 512
            });

            const actual = prepareIcons([icons]);
            const expected = {
                customIcon: Object.assign(icons, { extension: '.png' }),
                appIcon: undefined,
                installerIcon: undefined,
                highResIcons: []
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with custom icons, when there is two icons with wrong width and height set.', () => {
            const icon1 = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova.png'),
                width: 512,
                height: 512
            });

            const icon2 = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_extra.png'),
                width: 512,
                height: 512
            });

            let actual = prepareIcons([icon1, icon2]);
            let expected = {
                customIcon: icon2,
                appIcon: undefined,
                installerIcon: undefined,
                highResIcons: []
            };

            expect(expected).toEqual(actual);

            // The emit was called
            expect(emitSpy).toHaveBeenCalled();

            // The emit message was.
            actual = emitSpy.calls.argsFor(0)[1];
            expected = `Found extra icon for target undefined: ${path.join('res', 'electron', 'cordova.png')} and ignoring in favor of ${path.join('res', 'electron', 'cordova_extra.png')}.`;
            expect(actual).toEqual(expected);
        });

        it('should return array of objects with custom icons, when there is only one icon with wrong width and height set.', () => {
            const icons = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                width: 500,
                height: 500
            });

            const actual = prepareIcons([icons]);
            const expected = {
                customIcon: undefined,
                appIcon: undefined,
                installerIcon: undefined,
                highResIcons: []
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with installer icon, when icon is defined for target=installer', () => {
            const icons = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512
            });

            const actual = prepareIcons([icons]);
            const expected = {
                customIcon: undefined,
                appIcon: undefined,
                installerIcon: Object.assign(icons, { extension: '.png' }),
                highResIcons: []
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with app and installer icon, when there is one icon with target=app and one with target=installer', () => {
            const app = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const icons = [app, installer];

            const actual = prepareIcons(icons);
            const expected = {
                customIcon: undefined,
                appIcon: Object.assign(app, { extension: '.png' }),
                installerIcon: Object.assign(installer, { extension: '.png' }),
                highResIcons: []
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with app and installer icon, when there more one icon with target=app and more than one with target=installer', () => {
            const app1 = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const app2 = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_extra.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const installer2 = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512_extra.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const icons = [app1, app2, installer, installer2];

            let actual = prepareIcons(icons);
            let expected = {
                customIcon: undefined,
                appIcon: Object.assign(app2, { extension: '.png' }),
                installerIcon: Object.assign(installer2, { extension: '.png' }),
                highResIcons: []
            };

            expect(expected).toEqual(actual);

            // The emit was called
            expect(emitSpy).toHaveBeenCalled();

            // The emit message was.
            actual = emitSpy.calls.argsFor(0)[1];
            expected = `Found extra icon for target app: ${path.join('res', 'electron', 'cordova.png')} and ignoring in favor of ${path.join('res', 'electron', 'cordova_extra.png')}.`;
            expect(actual).toEqual(expected);
            actual = emitSpy.calls.argsFor(1)[1];
            expected = `Found extra icon for target installer: ${path.join('res', 'electron', 'cordova_512.png')} and ignoring in favor of ${path.join('res', 'electron', 'cordova_512_extra.png')}.`;
            expect(actual).toEqual(expected);
        });

        it('should return array of objects with high resolution icons, if they are defined', () => {
            const highRes10 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const icons = [highRes10, highRes15, highRes20, highRes40, highRes80];

            const actual = prepareIcons(icons);
            const expected = {
                customIcon: undefined,
                appIcon: undefined,
                installerIcon: undefined,
                highResIcons: [
                    Object.assign(highRes15, { suffix: '1.5x', extension: '.png' }),
                    Object.assign(highRes20, { suffix: '2x', extension: '.png' }),
                    Object.assign(highRes40, { suffix: '4x', extension: '.png' }),
                    Object.assign(highRes80, { suffix: '8x', extension: '.png' }),
                    Object.assign(highRes10, { suffix: '1x', extension: '.png' })
                ]
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with high resolution icons, if they are defined and an extra icon with target=installer', () => {
            const installer = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const highRes10 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const icons = [installer, highRes10, highRes15, highRes20, highRes40, highRes80];

            const actual = prepareIcons(icons);
            const expected = {
                customIcon: undefined,
                appIcon: undefined,
                installerIcon: Object.assign(installer, { extension: '.png' }),
                highResIcons: [
                    Object.assign(highRes15, { suffix: '1.5x', extension: '.png' }),
                    Object.assign(highRes20, { suffix: '2x', extension: '.png' }),
                    Object.assign(highRes40, { suffix: '4x', extension: '.png' }),
                    Object.assign(highRes80, { suffix: '8x', extension: '.png' }),
                    Object.assign(highRes10, { suffix: '1x', extension: '.png' })
                ]
            };

            expect(expected).toEqual(actual);
        });
    });

    describe('findHighResIcons', () => {
        let findHighResIcons;

        beforeEach(() => {
            createSpies();
            findHighResIcons = prepare.__get__('findHighResIcons');
        });

        it('should return array of objects with remaining icons, when there is only one icon in res folder.', () => {
            const icons = mockGetImageItem({
                src: path.join('res', 'logo.png'),
                platform: undefined
            });

            const actual = findHighResIcons([icons]);
            const expected = {
                highResIcons: [],
                remainingIcons: [icons]
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with remaining icons, when there is only one icon in res/electron folder.', () => {
            const icons = mockGetImageItem({
                src: path.join('res', 'electron', 'logo.png')
            });

            const actual = findHighResIcons([icons]);
            const expected = {
                highResIcons: [],
                remainingIcons: [icons]
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with remaining icon, when there is only one icon with correct width and height set.', () => {
            const icons = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                width: 512,
                height: 512
            });

            const actual = findHighResIcons([icons]);
            const expected = {
                highResIcons: [],
                remainingIcons: [icons]
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with remaining icon, when icon is defined for target=installer', () => {
            const icons = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512
            });

            const actual = findHighResIcons([icons]);
            const expected = {
                highResIcons: [],
                remainingIcons: [icons]
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with app and installer icon, when there is one icon with target=app and one with target=installer', () => {
            const app = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const icons = [app, installer];

            const actual = findHighResIcons(icons);
            const expected = {
                highResIcons: [],
                remainingIcons: icons
            };

            expect(expected).toEqual(actual);
        });

        it('should return remainingIcons array of objects with app and installer icon, when there more one icon with target=app and more than one with target=installer', () => {
            const app = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const installer2 = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512_extra.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const icons = [app, installer, installer2];

            const actual = findHighResIcons(icons);
            const expected = {
                highResIcons: [],
                remainingIcons: icons
            };

            expect(expected).toEqual(actual);
        });

        it('should throw Cordova Error when there is no base icon', () => {
            const highRes15 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const icons = [highRes15, highRes20, highRes40, highRes80];

            expect(() => {
                findHighResIcons(icons);
            }).toThrow(
                new CordovaError('Base icon for high resolution images was not found.')
            );
        });

        it('should return array of objects with high resolution icons, if they are defined', () => {
            const highRes10 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const icons = [highRes10, highRes15, highRes20, highRes40, highRes80];

            const actual = findHighResIcons(icons);
            const expected = {
                highResIcons: [
                    Object.assign(highRes15, { suffix: '1.5x', extension: '.png' }),
                    Object.assign(highRes20, { suffix: '2x', extension: '.png' }),
                    Object.assign(highRes40, { suffix: '4x', extension: '.png' }),
                    Object.assign(highRes80, { suffix: '8x', extension: '.png' }),
                    Object.assign(highRes10, { suffix: '1x', extension: '.png' })
                ],
                remainingIcons: []
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with high resolution icons, if they are defined and an extra icon with target=installer', () => {
            const installer = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const highRes10 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const icons = [installer, highRes10, highRes15, highRes20, highRes40, highRes80];

            const actual = findHighResIcons(icons);
            const expected = {
                highResIcons: [
                    Object.assign(highRes15, { suffix: '1.5x', extension: '.png' }),
                    Object.assign(highRes20, { suffix: '2x', extension: '.png' }),
                    Object.assign(highRes40, { suffix: '4x', extension: '.png' }),
                    Object.assign(highRes80, { suffix: '8x', extension: '.png' }),
                    Object.assign(highRes10, { suffix: '1x', extension: '.png' })
                ],
                remainingIcons: [installer]
            };

            expect(expected).toEqual(actual);
        });

        it('should return array of objects with high resolution icons, if they are defined and remaining icon with target=installer', () => {
            const highRes10 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@8x.png'), target: 'installer' });

            const icons = [highRes10, highRes15, highRes20, highRes40, highRes80];

            const actual = findHighResIcons(icons);
            const expected = {
                highResIcons: [
                    Object.assign(highRes15, { suffix: '1.5x', extension: '.png' }),
                    Object.assign(highRes20, { suffix: '2x', extension: '.png' }),
                    Object.assign(highRes40, { suffix: '4x', extension: '.png' }),
                    Object.assign(highRes80, { suffix: '8x', extension: '.png' }),
                    Object.assign(highRes10, { suffix: '1x', extension: '.png' })
                ],
                remainingIcons: [Object.assign(highRes80, { suffix: '8x', extension: '.png' })]
            };

            expect(expected).toEqual(actual);
        });
    });

    describe('createResourceMap method', () => {
        let createResourceMap;
        let cordovaProject;
        let locations;

        beforeEach(() => {
            prepare = rewire(path.join(rootDir, 'lib/prepare'));

            cordovaProject = Object.assign({}, cordovaProjectDefault);
            locations = Object.assign({}, locationsDefault);
            createResourceMap = prepare.__get__('createResourceMap');
            const existsSyncSpy = jasmine.createSpy('existsSyncSpy').and.returnValue(true);
            prepare.__set__('fs', { existsSync: existsSyncSpy });
        });

        it('should map custom icon to installer and app icon locations', () => {
            const icon = mockGetImageItem({
                src: path.join('res', 'logo.png'),
                platform: undefined
            });
            const data = {
                customIcon: Object.assign(icon, { extension: '.png' }),
                appIcon: undefined,
                installerIcon: undefined,
                highResIcons: []
            };

            const actual = createResourceMap(cordovaProject, locations, data);
            const expected = [
                { [path.join('res', 'logo.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'app.png') },
                { [path.join('res', 'logo.png')]: path.join('MOCK_PROJECT_ROOT', 'build-res', 'installer.png') }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map installer icon to appoporiate location', () => {
            const icons = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512
            });
            const data = {
                customIcon: undefined,
                appIcon: undefined,
                installerIcon: Object.assign(icons, { extension: '.png' }),
                highResIcons: []
            };

            const actual = createResourceMap(cordovaProject, locations, data);
            const expected = [
                { [path.join('res', 'electron', 'cordova_512.png')]: path.join('MOCK_PROJECT_ROOT', 'build-res', 'installer.png') }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map installer and app icon to appoporiate location', () => {
            const app = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const data = {
                customIcon: undefined,
                appIcon: Object.assign(app, { extension: '.png' }),
                installerIcon: Object.assign(installer, { extension: '.png' }),
                highResIcons: []
            };

            const actual = createResourceMap(cordovaProject, locations, data);
            const expected = [
                { [path.join('res', 'electron', 'cordova.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'app.png') },
                { [path.join('res', 'electron', 'cordova_512.png')]: path.join('MOCK_PROJECT_ROOT', 'build-res', 'installer.png') }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map high resolution icons to appoporiate location', () => {
            const highRes10 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const data = {
                customIcon: undefined,
                appIcon: undefined,
                installerIcon: undefined,
                highResIcons: [
                    Object.assign(highRes15, { suffix: '1.5x', extension: '.png' }),
                    Object.assign(highRes20, { suffix: '2x', extension: '.png' }),
                    Object.assign(highRes40, { suffix: '4x', extension: '.png' }),
                    Object.assign(highRes80, { suffix: '8x', extension: '.png' }),
                    Object.assign(highRes10, { suffix: '1x', extension: '.png' })
                ]
            };

            const actual = createResourceMap(cordovaProject, locations, data);
            const expected = [
                { [path.join('res', 'electron', 'cordova@1.5x.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'icon@1.5x.png') },
                { [path.join('res', 'electron', 'cordova@2x.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'icon@2x.png') },
                { [path.join('res', 'electron', 'cordova@4x.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'icon@4x.png') },
                { [path.join('res', 'electron', 'cordova@8x.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'icon@8x.png') },
                { [path.join('res', 'electron', 'cordova.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'icon.png') }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map high resolution icons and installer icon to appoporiate location', () => {
            const installer = mockGetImageItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const highRes10 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetImageItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const data = {
                customIcon: undefined,
                appIcon: undefined,
                installerIcon: Object.assign(installer, { extension: '.png' }),
                highResIcons: [
                    Object.assign(highRes15, { suffix: '1.5x', extension: '.png' }),
                    Object.assign(highRes20, { suffix: '2x', extension: '.png' }),
                    Object.assign(highRes40, { suffix: '4x', extension: '.png' }),
                    Object.assign(highRes80, { suffix: '8x', extension: '.png' }),
                    Object.assign(highRes10, { suffix: '1x', extension: '.png' })
                ]
            };

            const actual = createResourceMap(cordovaProject, locations, data);
            const expected = [
                { [path.join('res', 'electron', 'cordova_512.png')]: path.join('MOCK_PROJECT_ROOT', 'build-res', 'installer.png') },
                { [path.join('res', 'electron', 'cordova@1.5x.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'icon@1.5x.png') },
                { [path.join('res', 'electron', 'cordova@2x.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'icon@2x.png') },
                { [path.join('res', 'electron', 'cordova@4x.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'icon@4x.png') },
                { [path.join('res', 'electron', 'cordova@8x.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'icon@8x.png') },
                { [path.join('res', 'electron', 'cordova.png')]: path.join('MOCK_PROJECT_ROOT', 'www', 'img', 'icon.png') }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map splashScreen images to the .cdv folder in the platform/www', () => {
            const icon = mockGetImageItem({
                src: path.join('res', 'electron', 'splash.png'),
                platform: 'electron'
            });
            const data = {
                splashScreen: Object.assign(icon, { extension: '.png' })
            };

            const actual = createResourceMap(cordovaProject, locations, data);
            const expected = [
                { [path.join('res', 'electron', 'splash.png')]: path.join('MOCK_PROJECT_ROOT', 'www', '.cdv', 'splashScreen.png') }
            ];

            expect(expected).toEqual(actual);
        });
    });

    describe('mapResources method', () => {
        let mapResources;
        let existsSyncSpy;
        let cordovaProject;

        beforeEach(() => {
            prepare = rewire(path.join(rootDir, 'lib/prepare'));

            cordovaProject = Object.assign({}, cordovaProjectDefault);
            mapResources = prepare.__get__('mapResources');

            existsSyncSpy = jasmine.createSpy('existsSyncSpy').and.returnValue(true);
            prepare.__set__('fs', { existsSync: existsSyncSpy });
        });

        it('should return an empty object when the resource path does not exist.', () => {
            existsSyncSpy.and.returnValue(false);
            const resources = mapResources(cordovaProject.root, '', '');
            expect(resources).toEqual({});
        });

        it('should map to file to file', () => {
            const sourcePath = path.join(cordovaProject.root, 'res', 'electron', 'cordova_512.png');
            const targetPath = path.join(cordovaProject.root, 'www', 'img', 'icon.png');

            const expected = {};
            expected[sourcePath] = targetPath;

            const actual = mapResources(cordovaProject.root, sourcePath, targetPath);
            expect(existsSyncSpy).toHaveBeenCalled();
            expect(expected).toEqual(actual);
        });

        it('should map to folder to folder', () => {
            const sourcePath = path.join(cordovaProject.root, 'res', 'electron');
            const targetPath = path.join(cordovaProject.root, 'www', 'img');

            const expected = {};
            expected[sourcePath] = targetPath;

            const actual = mapResources(cordovaProject.root, sourcePath, targetPath);
            expect(existsSyncSpy).toHaveBeenCalled();
            expect(expected).toEqual(actual);
        });
    });

    describe('copyResources method', () => {
        let copyResources;
        let fsCopySyncSpy;
        let cordovaProject;

        beforeEach(() => {
            prepare = rewire(path.join(rootDir, 'lib/prepare'));

            cordovaProject = Object.assign({}, cordovaProjectDefault);
            copyResources = prepare.__get__('copyResources');

            fsCopySyncSpy = jasmine.createSpy('copySync');
            prepare.__set__('fs', { copySync: fsCopySyncSpy });
        });

        it('should not copy as no resources provided.', () => {
            copyResources(cordovaProject.root, [{}]);
            expect(fsCopySyncSpy).not.toHaveBeenCalled();
        });

        it('should copy provided resources.', () => {
            copyResources(cordovaProject.root, [
                { [path.join('res', 'electron', 'cordova_512.png')]: path.join(cordovaProject.root, 'build-res', 'installer.png') },
                { [path.join('res', 'electron', 'cordova.png')]: path.join(cordovaProject.root, 'www', 'img', 'icon.png') }
            ]);

            expect(fsCopySyncSpy).toHaveBeenCalled();

            const installerIconSrcPathTest = fsCopySyncSpy.calls.argsFor(0)[0];
            const installerIconDestPathTest = fsCopySyncSpy.calls.argsFor(0)[1];
            expect(installerIconSrcPathTest).toBe(path.join(cordovaProject.root, 'res', 'electron', 'cordova_512.png'));
            expect(installerIconDestPathTest).toBe(path.join(cordovaProject.root, 'build-res', 'installer.png'));

            const appIconSrcPathTest = fsCopySyncSpy.calls.argsFor(1)[0];
            const appIconDestPathTest = fsCopySyncSpy.calls.argsFor(1)[1];
            expect(appIconSrcPathTest).toBe(path.join(cordovaProject.root, 'res', 'electron', 'cordova.png'));
            expect(appIconDestPathTest).toBe(path.join(cordovaProject.root, 'www', 'img', 'icon.png'));
        });
    });
});
