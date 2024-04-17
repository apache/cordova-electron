/* eslint-disable no-template-curly-in-string */
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
const path = require('node:path');
const fs = require('node:fs');

const rootDir = path.resolve(__dirname, '../../../..');
const fixturesDir = path.join(rootDir, 'tests/spec/fixtures');
const tmpDir = path.join(rootDir, 'temp');
const testProjectDir = path.join(tmpDir, 'testapp');

const Api = rewire(path.join(rootDir, 'lib/Api'));
const check_reqs = require(path.join(rootDir, 'lib/check_reqs'));

describe('Testing build.js:', () => {
    let build;
    let api;

    beforeAll(() => {
        fs.mkdirSync(tmpDir, { recursive: true });
        fs.cpSync(path.resolve(fixturesDir, 'testapp'), path.resolve(tmpDir, 'testapp'), { recursive: true });
        api = new Api(null, testProjectDir);
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    beforeEach(() => {
        build = rewire(path.join(rootDir, 'lib/build'));
    });

    describe('Build class', () => {
        let ElectronBuilder;
        let electronBuilder;
        let requireSpy;
        let existsSyncSpy;
        let emitSpy;

        const emptyObj = {};

        beforeEach(() => {
            ElectronBuilder = build.__get__('ElectronBuilder');

            build.__set__({ require: requireSpy });
            spyOn(process, 'env');

            emitSpy = jasmine.createSpy('emit');
            build.__set__('events', { emit: emitSpy });
        });

        it('should should be defined.', () => {
            expect(ElectronBuilder).toBeDefined();
        });

        it('should set isDevelopment to undefined and buildConfig to false, when buildOptions is empty.', () => {
            electronBuilder = new ElectronBuilder(emptyObj, emptyObj);

            expect(electronBuilder.api).toEqual(emptyObj);
            expect(electronBuilder.isDevelopment).toEqual(undefined);
            expect(electronBuilder.buildConfig).toEqual(false);
        });

        it('should set isDevelopment to true and buildConfig to false, when buildOptions is not empty.', () => {
            // mock buildOptions Objecet
            const buildOptions = { debug: true, argv: [] };

            electronBuilder = new ElectronBuilder(buildOptions, emptyObj);

            expect(electronBuilder.api).toEqual(emptyObj);
            expect(electronBuilder.isDevelopment).toEqual(true);
            expect(electronBuilder.buildConfig).toEqual(false);
        });

        it('should set isDevelopment to true and buildConfig to false, when buildOptions.buildCofing is defined, but does not exist.', () => {
            // mock buildOptions Objecet
            const buildOptions = { debug: true, buildConfig: 'build.xml', argv: [] };

            // create spy
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, emptyObj);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(electronBuilder.api).toEqual(emptyObj);
            expect(electronBuilder.isDevelopment).toEqual(true);
            expect(electronBuilder.buildConfig).toEqual(false);
        });

        it('should set isDevelopment to true and buildConfig to true, when buildOptions.buildCofing is defined and does exist.', () => {
            // mock buildOptions Objecet
            const buildOptions = { debug: true, buildConfig: {}, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(true);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            electronBuilder = new ElectronBuilder(buildOptions, emptyObj);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();
            expect(electronBuilder.api).toEqual(emptyObj);
            expect(electronBuilder.isDevelopment).toEqual(true);
            expect(electronBuilder.buildConfig).toEqual(true);
        });

        it('should set isDevelopment is true and buildConfig to actual config, when buildOptions.buildCofing is actual cofing and does exist.', () => {
            // mock BuildConfig and buildOptions Object
            const buildConfig = {
                electron: 'electron',
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: true, buildConfig, argv: [] };

            // create spies
            const getInstalledElectronVersionSpy = jasmine.createSpy('getInstalledElectronVersion').and.returnValue('1.33.7');
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy, getInstalledElectronVersion: getInstalledElectronVersionSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configure();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();
            expect(getInstalledElectronVersionSpy).toHaveBeenCalled();
            expect(electronBuilder.buildSettings).toEqual(buildConfig);
        });

        it('should set isDevelopment to false and buildConfig to actual config, when buildOptions.buildCofing is actual cofing and does exist.', () => {
            // mock BuildConfig and buildOptions Object
            const buildConfig = {
                electron: 'electron',
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            const getInstalledElectronVersionSpy = jasmine.createSpy('getInstalledElectronVersion').and.returnValue('1.33.7');
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy, getInstalledElectronVersion: getInstalledElectronVersionSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configure();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();
            expect(getInstalledElectronVersionSpy).toHaveBeenCalled();
            expect(electronBuilder.buildSettings).toEqual(buildConfig);
        });

        it('should set isDevelopment to false and buildConfig to actual config, when buildOptions.buildCofing file does not exist.', () => {
            // mock BuildConfig and buildOptions Object
            const buildConfig = {
                electron: 'electron',
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            build.__set__('fs', { existsSync: existsSyncSpy });

            expect(() => {
                electronBuilder = new ElectronBuilder(buildOptions, api).configure();

                expect(existsSyncSpy).toHaveBeenCalled();
                expect(electronBuilder.buildSettings).toEqual(buildConfig);
            }).toThrowError(/not supported as a default target platform/);
        });

        it('should set configureUserBuildSettings (release mode) for all 3 platforms and one invalid one.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { package: ['package', 'package2'], arch: 'arch', signing: { debug: 'debug', release: 'release', store: 'store' } },
                win: { package: ['package', 'package2'], arch: 'arch', signing: { debug: 'debug', release: 'release' } },
                linux: { package: ['package', 'package2'], arch: 'arch', category: 'Game' },
                darwin: {}
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedMac = {
                target: [
                    { target: 'package', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                type: '${BUILD_TYPE}',
                icon: '${APP_INSTALLER_ICON}'
            };
            const expectedLinux = {
                target: [
                    { target: 'package', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                icon: '${APP_INSTALLER_ICON}',
                category: 'Game'
            };

            expect(electronBuilder.userBuildSettings.config.mac).toEqual(expectedMac);
            expect(electronBuilder.userBuildSettings.config.linux).toEqual(expectedLinux);
            expect(electronBuilder.userBuildSettings.config.win).toEqual(undefined);
        });

        it('should continue to use defaults with supplied valid configs.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { signing: { provisioningProfile: 'release' } }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig: 'LOAD_MY_FAKE_DATA', argv: [] };

            // create spies
            build.__set__('fs', {
                existsSync: jasmine.createSpy('existsSync').and.returnValue(true)
            });

            build.__set__('require', (file) => {
                if (file === 'LOAD_MY_FAKE_DATA') return buildConfig;
                return require(file);
            });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            const expectedMac = [
                { target: 'dmg', arch: ['x64'] },
                { target: 'zip', arch: ['x64'] }
            ];

            expect(electronBuilder.userBuildSettings.config.mac.target).toEqual(expectedMac);
        });

        it('should use all default options when no options supplied.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig: 'LOAD_MY_FAKE_DATA', argv: [] };

            // create spies
            build.__set__('fs', {
                existsSync: jasmine.createSpy('existsSync').and.returnValue(true)
            });

            build.__set__('require', (file) => {
                if (file === 'LOAD_MY_FAKE_DATA') return buildConfig;
                return require(file);
            });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            const expectedMac = [
                { target: 'dmg', arch: ['x64'] },
                { target: 'zip', arch: ['x64'] }
            ];

            expect(electronBuilder.userBuildSettings.config.mac.target).toEqual(expectedMac);
        });

        it('should set configureUserBuildSettings (debug mode) for all 3 platforms and one invalid one.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { package: ['package', 'package2'], arch: 'arch', signing: { debug: 'debug', release: 'release', store: 'store' } },
                win: { package: ['package', 'package2'], arch: 'arch', signing: { debug: 'debug', release: 'release' } },
                linux: { package: ['package', 'package2'], arch: 'arch' },
                darwin: {}
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: true, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedMac = {
                target: [
                    { target: 'package', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                type: '${BUILD_TYPE}',
                icon: '${APP_INSTALLER_ICON}'
            };
            const expectedLinux = {
                target: [
                    { target: 'package', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                icon: '${APP_INSTALLER_ICON}'
            };

            expect(electronBuilder.userBuildSettings.config.mac).toEqual(expectedMac);
            expect(electronBuilder.userBuildSettings.config.linux).toEqual(expectedLinux);
            expect(electronBuilder.userBuildSettings.config.win).toEqual(undefined);
        });

        it('should set configureUserBuildSettings for all 3 platforms without package.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { arch: ['arch1', 'arch2'], signing: { debug: 'debug', release: 'release', store: 'store' } },
                windows: { arch: ['arch1', 'arch2'], signing: { debug: 'debug', release: 'release' } },
                linux: { arch: ['arch1', 'arch2'] }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig: 'LOAD_MY_FAKE_DATA', argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            // requireSpy = jasmine.createSpy('require').and.returnValue();
            build.__set__('fs', { existsSync: existsSyncSpy });

            build.__set__('require', (file) => {
                if (file === 'LOAD_MY_FAKE_DATA') return buildConfig;
                return require(file);
            });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();

            const expected = {
                linux: [],
                mac: [],
                win: [],
                config: {
                    linux: {
                        icon: '${APP_INSTALLER_ICON}',
                        target: [
                            {
                                target: 'tar.gz',
                                arch: ['arch1', 'arch2']
                            }
                        ]
                    },
                    mac: {
                        type: '${BUILD_TYPE}',
                        icon: '${APP_INSTALLER_ICON}',
                        target: [
                            {
                                target: 'dmg',
                                arch: ['arch1', 'arch2']
                            },
                            {
                                target: 'zip',
                                arch: ['arch1', 'arch2']
                            }
                        ]
                    },
                    win: {
                        icon: '${APP_INSTALLER_ICON}',
                        target: [
                            {
                                target: 'nsis',
                                arch: ['arch1', 'arch2']
                            }
                        ]
                    }
                }
            };

            expect(electronBuilder.userBuildSettings).toEqual(expected);
        });

        it('should not set this.userBuildSettings.', () => {
            const buildConfig = {
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig: 'LOAD_MY_FAKE_DATA', argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            // requireSpy = jasmine.createSpy('require').and.returnValue();
            build.__set__('fs', { existsSync: existsSyncSpy });

            build.__set__('require', (file) => {
                if (file === 'LOAD_MY_FAKE_DATA') return buildConfig;
                return require(file);
            });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(electronBuilder.userBuildSettings).toBe(undefined);
        });

        it('should set configureUserBuildSettings for all 3 platforms without arch.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release', store: 'store' } },
                win: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release' } },
                linux: { package: ['package', 'package2'] }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedMac = {
                target: [
                    { target: 'package', arch: ['x64'] },
                    { target: 'package2', arch: ['x64'] }
                ],
                type: '${BUILD_TYPE}',
                icon: '${APP_INSTALLER_ICON}'
            };
            const expectedLinux = {
                target: [
                    { target: 'package', arch: ['x64'] },
                    { target: 'package2', arch: ['x64'] }
                ],
                icon: '${APP_INSTALLER_ICON}'
            };

            expect(electronBuilder.userBuildSettings.config.mac).toEqual(expectedMac);
            expect(electronBuilder.userBuildSettings.config.linux).toEqual(expectedLinux);
            expect(electronBuilder.userBuildSettings.config.win).toEqual(undefined);
        });

        it('should set configureUserBuildSettings for all 3 platforms without signing.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { package: ['package', 'package2'], arch: 'arch' },
                win: { package: ['package', 'package2'], arch: 'arch' },
                linux: { package: ['package', 'package2'], arch: 'arch' }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: true, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedMac = {
                target: [
                    { target: 'package', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                type: '${BUILD_TYPE}',
                icon: '${APP_INSTALLER_ICON}'
            };
            const expectedLinux = {
                target: [
                    { target: 'package', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                icon: '${APP_INSTALLER_ICON}'
            };

            expect(electronBuilder.userBuildSettings.config.mac).toEqual(expectedMac);
            expect(electronBuilder.userBuildSettings.config.linux).toEqual(expectedLinux);
            expect(electronBuilder.userBuildSettings.config.win).toEqual(undefined);
        });

        it('should set configureUserBuildSettings for mac when platform configs is empty.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: {}
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();
        });

        it('should throw new Error mac with incorrect platform build properties.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { pack: ['package', 'package2'], architecture: 'arch', sign: 'signing' }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();
            expect(() => { electronBuilder.configureUserBuildSettings(); }).toThrow(
                new Error('The platform "mac" contains an invalid property. Valid properties are: package, arch, signing')
            );
        });

        it('should set configureUserBuildSettings for when using windows instead of win.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                windows: { package: ['mas', 'package2'], arch: 'arch', signing: 'signing' }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedWin = {
                target: [
                    { target: 'mas', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                icon: '${APP_INSTALLER_ICON}'
            };

            expect(electronBuilder.userBuildSettings.config.mac).toEqual(undefined);
            expect(electronBuilder.userBuildSettings.config.linux).toEqual(undefined);
            expect(electronBuilder.userBuildSettings.config.win).toEqual(expectedWin);
        });

        it('should append package top-level key options if the object is empty.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { package: ['pkg', { dmg: { } }], arch: 'arch', signing: 'signing' }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedMac = {
                target: [
                    { target: 'pkg', arch: 'arch' },
                    { target: 'dmg', arch: 'arch' }
                ],
                type: '${BUILD_TYPE}',
                icon: '${APP_INSTALLER_ICON}'
            };

            expect(electronBuilder.userBuildSettings.config.mac).toEqual(expectedMac);
            expect(electronBuilder.userBuildSettings.config.dmg).toEqual({ });
            expect(electronBuilder.userBuildSettings.config.linux).toEqual(undefined);
            expect(electronBuilder.userBuildSettings.config.windows).toEqual(undefined);
        });

        it('should append package top-level key options.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { package: ['pkg', { dmg: { format: 'UDZO' } }], arch: 'arch', signing: 'signing' }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedMac = {
                target: [
                    { target: 'pkg', arch: 'arch' },
                    { target: 'dmg', arch: 'arch' }
                ],
                type: '${BUILD_TYPE}',
                icon: '${APP_INSTALLER_ICON}'
            };

            const expectedDmgOptions = {
                format: 'UDZO'
            };

            expect(electronBuilder.userBuildSettings.config.mac).toEqual(expectedMac);
            expect(electronBuilder.userBuildSettings.config.dmg).toEqual(expectedDmgOptions);
            expect(electronBuilder.userBuildSettings.config.linux).toEqual(undefined);
            expect(electronBuilder.userBuildSettings.config.windows).toEqual(undefined);
        });

        it('should append package top-level key nested options.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { package: ['pkg', { dmg: { format: { UDZO: '' } } }], arch: 'arch', signing: 'signing' }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedMac = {
                target: [
                    { target: 'pkg', arch: 'arch' },
                    { target: 'dmg', arch: 'arch' }
                ],
                type: '${BUILD_TYPE}',
                icon: '${APP_INSTALLER_ICON}'
            };

            const expectedDmgOptions = {
                format: { UDZO: '' }
            };

            expect(electronBuilder.userBuildSettings.config.mac).toEqual(expectedMac);
            expect(electronBuilder.userBuildSettings.config.dmg).toEqual(expectedDmgOptions);
            expect(electronBuilder.userBuildSettings.config.linux).toEqual(undefined);
            expect(electronBuilder.userBuildSettings.config.windows).toEqual(undefined);
        });

        it('should set overridable per platform options.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: {
                    package: ['package', 'package2'],
                    arch: 'arch',
                    appId: 'com.test.app',
                    artifactName: '${productName}-${version}.${ext}',
                    compression: 'normal',
                    files: [
                        'test/files/file1',
                        'test/files/file2'
                    ],
                    extraResources: [
                        'test/resources/file1',
                        'test/resources/file2'
                    ],
                    extraFiles: [
                        'test/extra/files/file1',
                        'test/extra/files/file2'
                    ],
                    asar: false,
                    fileAssociations: [
                        {
                            ext: 'png',
                            name: 'PNG'
                        }
                    ],
                    forceCodeSigning: false,
                    electronUpdaterCompatibility: '>=2.15',
                    publish: ['github', 'bintray'],
                    detectUpdateChannel: false,
                    generateUpdatesFilesForAllChannels: false
                }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: true, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedMac = {
                target: [
                    { target: 'package', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                type: '${BUILD_TYPE}',
                icon: '${APP_INSTALLER_ICON}',
                appId: 'com.test.app',
                artifactName: '${productName}-${version}.${ext}',
                compression: 'normal',
                files: [
                    'test/files/file1',
                    'test/files/file2'
                ],
                extraResources: [
                    'test/resources/file1',
                    'test/resources/file2'
                ],
                extraFiles: [
                    'test/extra/files/file1',
                    'test/extra/files/file2'
                ],
                asar: false,
                fileAssociations: [
                    {
                        ext: 'png',
                        name: 'PNG'
                    }
                ],
                forceCodeSigning: false,
                electronUpdaterCompatibility: '>=2.15',
                publish: ['github', 'bintray'],
                detectUpdateChannel: false,
                generateUpdatesFilesForAllChannels: false
            };

            expect(electronBuilder.userBuildSettings.config.mac).toEqual(expectedMac);
        });

        it('should set top-level macOS specific.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: {
                    package: ['package', 'package2'],
                    arch: 'arch',
                    category: 'public.app-category.developer-tools',
                    icon: 'build/icon.icns',
                    bundleVersion: 'CFBundleVersion',
                    bundleShortVersion: 'CFBundleShortVersionString',
                    darkModeSupport: true,
                    helperBundleId: '${appBundleIdentifier}.helper',
                    extendInfo: 'Info.plist',
                    binaries: [
                        'test/binaries/file1',
                        'test/binaries/file2'
                    ],
                    minimumSystemVersion: '10.0.10',
                    electronLanguages: [
                        'en',
                        'jp',
                        'ru'
                    ],
                    extraDistFiles: [
                        'test/extraDist/file1',
                        'test/extraDist/file2'
                    ]
                }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: true, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedMac = {
                target: [
                    { target: 'package', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                type: '${BUILD_TYPE}',
                category: 'public.app-category.developer-tools',
                icon: 'build/icon.icns',
                bundleVersion: 'CFBundleVersion',
                bundleShortVersion: 'CFBundleShortVersionString',
                darkModeSupport: true,
                helperBundleId: '${appBundleIdentifier}.helper',
                extendInfo: 'Info.plist',
                binaries: [
                    'test/binaries/file1',
                    'test/binaries/file2'
                ],
                minimumSystemVersion: '10.0.10',
                electronLanguages: [
                    'en',
                    'jp',
                    'ru'
                ],
                extraDistFiles: [
                    'test/extraDist/file1',
                    'test/extraDist/file2'
                ]
            };

            expect(electronBuilder.userBuildSettings.config.mac).toEqual(expectedMac);
        });

        it('should set top-level Windows specific.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                windows: {
                    package: ['package', 'package2'],
                    arch: 'arch',
                    icon: 'build/icon.icns',
                    legalTrademarks: 'trademarks and registered trademarks',
                    rfc3161TimeStampServer: 'http://timestamp.comodoca.com/rfc3161',
                    timeStampServer: 'http://timestamp.verisign.com/scripts/timstamp.dll',
                    publisherName: 'publisher name',
                    verifyUpdateCodeSignature: true,
                    requestedExecutionLevel: 'asInvoker',
                    signAndEditExecutable: true,
                    signDlls: false
                }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: true, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedWindows = {
                target: [
                    { target: 'package', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                icon: 'build/icon.icns',
                legalTrademarks: 'trademarks and registered trademarks',
                rfc3161TimeStampServer: 'http://timestamp.comodoca.com/rfc3161',
                timeStampServer: 'http://timestamp.verisign.com/scripts/timstamp.dll',
                publisherName: 'publisher name',
                verifyUpdateCodeSignature: true,
                requestedExecutionLevel: 'asInvoker',
                signAndEditExecutable: true,
                signDlls: false
            };

            expect(electronBuilder.userBuildSettings.config.win).toEqual(expectedWindows);
        });

        it('should set top-level Linux specific.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                linux: {
                    package: ['package', 'package2'],
                    arch: 'arch',
                    maintainer: 'maintainer',
                    vendor: 'vendor',
                    executableName: 'productName',
                    icon: 'path to icon set directory or one png file',
                    synopsis: 'short description',
                    description: 'description',
                    category: 'Utility',
                    mimeTypes: [
                        'type1',
                        'type2'
                    ],
                    desktop: 'desktop file entries'
                }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: true, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(buildConfig);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            const __validateUserPlatformBuildSettingsSpy = jasmine.createSpy('__validateUserPlatformBuildSettings').and.returnValue(true);
            build.__set__({ __validateUserPlatformBuildSettings: __validateUserPlatformBuildSettingsSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).configureUserBuildSettings();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();

            const expectedLinux = {
                target: [
                    { target: 'package', arch: 'arch' },
                    { target: 'package2', arch: 'arch' }
                ],
                maintainer: 'maintainer',
                vendor: 'vendor',
                executableName: 'productName',
                icon: 'path to icon set directory or one png file',
                synopsis: 'short description',
                description: 'description',
                category: 'Utility',
                mimeTypes: [
                    'type1',
                    'type2'
                ],
                desktop: 'desktop file entries'
            };

            expect(electronBuilder.userBuildSettings.config.linux).toEqual(expectedLinux);
        });

        it('should fetchPlatformDefaults true.', () => {
            // mock buildOptions Objecet and platformFile path
            const buildOptions = { debug: true, buildConfig: 'build.xml', argv: [] };
            const platformFile = path.join(__dirname, 'build', 'platform.json');

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            requireSpy = jasmine.createSpy('require').and.returnValue(platformFile);
            build.__set__('fs', { existsSync: existsSyncSpy });
            build.__set__({ require: requireSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).fetchPlatformDefaults('electron');

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(requireSpy).toHaveBeenCalled();
            expect(electronBuilder).toEqual(platformFile);
        });

        it('should fetchPlatformDefaults false.', () => {
            // mock buildOptions Object
            const buildOptions = { debug: true, buildConfig: 'build.xml', argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api);

            expect(existsSyncSpy).toHaveBeenCalled();

            expect(() => { electronBuilder.fetchPlatformDefaults('name'); }).toThrow(new Error('Your platform "name" is not supported as a default target platform for Electron.'));
        });

        it('should __appendUserSigning linux signing.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                linux: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release' } }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).__appendUserSigning('linux', platformConfig.linux.signing, buildOptions);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalled();
            const actual = emitSpy.calls.argsFor(0)[1];
            const expected = 'The provided signing information for the Linux platform is ignored. Linux does not support signing.';
            expect(actual).toEqual(expected);
        });

        it('should __appendUserSigning mac with masconfig.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                mac: { package: ['package', 'package2'], signing: { store: { requirements: 'requirements' } } }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            // config.mas is appeneded to build options to spoof what __formatAppendUserSettings method would have performed.
            const buildOptions = { debug: false, buildConfig, argv: [], config: { mas: {} } };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).__appendUserSigning('mac', platformConfig.mac.signing, buildOptions);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(buildOptions.buildConfig.electron.mac.signing.store.requirements).toBe(undefined);
        });

        it('should format nsis-web taget with nsisWeb top-level configs in __formatAppendUserSettings.', () => {
            // Sample target configuration option
            const appPackageUrl = 'https://foo.bar/apps/win/web';
            // The settings which will be populated by `__formatAppendUserSettings`
            const userBuildSettings = {};
            // platform config partial from `build.json`
            const platformConfig = {
                package: [
                    { 'nsis-web': { appPackageUrl } }
                ]
            };
            // the mock `build.json`
            const buildConfig = { electron: { windows: platformConfig } };
            // the build options which is passed from CLI/Lib to Platform Build
            const buildOptions = { argv: [], buildConfig };

            // // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api)
                .__formatAppendUserSettings('win', platformConfig, userBuildSettings);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(userBuildSettings.config.nsisWeb.appPackageUrl).toBe(appPackageUrl);
        });

        it('should append user singing for windows', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                win: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release' } }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).__appendUserSigning('win', platformConfig, buildOptions);

            expect(existsSyncSpy).toHaveBeenCalled();
        });

        it('should set buildConfigs __appendMacUserSigning when files exist.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                darwin: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release', store: { requirements: 'requirements' } } }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            const config = {
                debug: 'debug',
                release: 'release',
                identity: 'identify',
                entitlements: 'entitlements',
                entitlementsInherit: 'entitlementsInherit',
                requirements: 'requirements',
                provisioningProfile: 'provisioningProfile',
                store: 'store'
            };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).__appendMacUserSigning(config, buildConfig);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(buildConfig.identity).toEqual(config.identity);
            expect(buildConfig.entitlements).toEqual(config.entitlements);
            expect(buildConfig.entitlementsInherit).toEqual(config.entitlementsInherit);
            expect(buildConfig.requirements).toEqual(config.requirements);
            expect(buildConfig.provisioningProfile).toEqual(config.provisioningProfile);
        });

        it('should emit warning when in __appendMacUserSigning when files does not exist and set identity to process env link.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                darwin: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release', store: { requirements: 'requirements' } } }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            const config = {
                debug: 'debug',
                release: 'release',
                entitlements: 'entitlements',
                entitlementsInherit: 'entitlementsInherit',
                requirements: 'requirements',
                provisioningProfile: 'provisioningProfile',
                store: 'store'
            };

            // set process.env.CSC_LINK
            process.env.CSC_LINK = 'csc_link';

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).__appendMacUserSigning(config, buildConfig);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalled();

            expect(buildConfig.identity).toEqual('csc_link');
            expect(buildConfig.entitlements).toEqual(undefined);
            expect(buildConfig.entitlementsInherit).toEqual(undefined);
            expect(buildConfig.requirements).toEqual(undefined);
            expect(buildConfig.provisioningProfile).toEqual(undefined);

            const actualEntitlements = emitSpy.calls.argsFor(0)[1];
            const expectedEntitlements = 'The provided entitlements file does not exist';
            expect(actualEntitlements).toContain(expectedEntitlements);

            const actualEntitlementsInherits = emitSpy.calls.argsFor(1)[1];
            const expectedEntitlementsInherits = 'The provided entitlements inherit file does not exist';
            expect(actualEntitlementsInherits).toContain(expectedEntitlementsInherits);

            const actualRequirements = emitSpy.calls.argsFor(2)[1];
            const expectedRequirements = 'The provided requirements file does not exist';
            expect(actualRequirements).toContain(expectedRequirements);

            const actualProvisioningProfile = emitSpy.calls.argsFor(3)[1];
            const expectedProvisioningProfiles = 'The provided provisioning profile does not exist';
            expect(actualProvisioningProfile).toContain(expectedProvisioningProfiles);
        });

        it('should emit warning when in __appendMacUserSigning when files does not exist and set identity to process env name.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                darwin: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release', store: { requirements: 'requirements' } } }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            const config = {
                debug: 'debug',
                release: 'release',
                entitlements: 'entitlements',
                entitlementsInherit: 'entitlementsInherit',
                requirements: 'requirements',
                provisioningProfile: 'provisioningProfile',
                store: 'store'
            };

            // set process.env.CSC_NAME
            process.env.CSC_NAME = 'csc_name';

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).__appendMacUserSigning(config, buildConfig);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalled();

            expect(buildConfig.identity).toEqual('csc_name');
            expect(buildConfig.entitlements).toEqual(undefined);
            expect(buildConfig.entitlementsInherit).toEqual(undefined);
            expect(buildConfig.requirements).toEqual(undefined);
            expect(buildConfig.provisioningProfile).toEqual(undefined);

            const actualEntitlements = emitSpy.calls.argsFor(0)[1];
            const expectedEntitlements = 'The provided entitlements file does not exist';
            expect(actualEntitlements).toContain(expectedEntitlements);

            const actualEntitlementsInherits = emitSpy.calls.argsFor(1)[1];
            const expectedEntitlementsInherits = 'The provided entitlements inherit file does not exist';
            expect(actualEntitlementsInherits).toContain(expectedEntitlementsInherits);

            const actualRequirements = emitSpy.calls.argsFor(2)[1];
            const expectedRequirements = 'The provided requirements file does not exist';
            expect(actualRequirements).toContain(expectedRequirements);

            const actualProvisioningProfile = emitSpy.calls.argsFor(3)[1];
            const expectedProvisioningProfiles = 'The provided provisioning profile does not exist';
            expect(actualProvisioningProfile).toContain(expectedProvisioningProfiles);
        });

        it('should set buildConfigs in __appendWindowsUserSigning for windows singning when files exist.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                windows: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release', store: 'requirements' } }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            const config = {
                debug: 'debug',
                release: 'release',
                identity: 'identify',
                certificateFile: 'certificateFile',
                certificatePassword: 'certificatePassword',
                certificateSubjectName: 'certificateSubjectName',
                certificateSha1: 'certificateSha1',
                signingHashAlgorithms: 'signingHashAlgorithms',
                additionalCertificateFile: 'additionalCertificateFile'
            };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).__appendWindowsUserSigning(config, buildConfig);

            expect(existsSyncSpy).toHaveBeenCalled();

            expect(buildConfig.certificateFile).toEqual(config.certificateFile);
            expect(buildConfig.certificatePassword).toEqual(config.certificatePassword);
            expect(buildConfig.certificateSubjectName).toEqual(config.certificateSubjectName);
            expect(buildConfig.certificateSha1).toEqual(config.certificateSha1);
            expect(buildConfig.signingHashAlgorithms).toEqual(config.signingHashAlgorithms);
            expect(buildConfig.additionalCertificateFile).toEqual(config.additionalCertificateFile);
        });

        it('should set buildConfigs in __appendWindowsUserSigning for windows singning when files exist, but certificate password does not.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                windows: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release', store: 'requirements' } }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            const config = {
                debug: 'debug',
                release: 'release',
                identity: 'identify',
                certificateFile: 'certificateFile',
                certificateSubjectName: 'certificateSubjectName',
                certificateSha1: 'certificateSha1',
                signingHashAlgorithms: 'signingHashAlgorithms',
                additionalCertificateFile: 'additionalCertificateFile'
            };

            // set process.env.CSC_KEY_PASSWORD
            process.env.CSC_KEY_PASSWORD = 'csc_key_password';

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).__appendWindowsUserSigning(config, buildConfig);

            expect(existsSyncSpy).toHaveBeenCalled();

            expect(buildConfig.certificateFile).toEqual(config.certificateFile);
            expect(buildConfig.certificatePassword).toEqual('csc_key_password');
            expect(buildConfig.certificateSubjectName).toEqual(config.certificateSubjectName);
            expect(buildConfig.certificateSha1).toEqual(config.certificateSha1);
            expect(buildConfig.signingHashAlgorithms).toEqual(config.signingHashAlgorithms);
            expect(buildConfig.additionalCertificateFile).toEqual(config.additionalCertificateFile);
        });

        it('should set buildConfigs in __appendWindowsUserSigning for windows singning when files exist, but certificate and process env password does not.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                windows: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release', store: 'requirements' } }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            const config = {
                debug: 'debug',
                release: 'release',
                identity: 'identify',
                certificateFile: 'certificateFile',
                certificateSubjectName: 'certificateSubjectName',
                certificateSha1: 'certificateSha1',
                signingHashAlgorithms: 'signingHashAlgorithms',
                additionalCertificateFile: 'additionalCertificateFile'
            };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).__appendWindowsUserSigning(config, buildConfig);

            expect(existsSyncSpy).toHaveBeenCalled();

            expect(buildConfig.certificateFile).toEqual(config.certificateFile);
            expect(buildConfig.certificatePassword).toEqual(undefined);
            expect(buildConfig.certificateSubjectName).toEqual(config.certificateSubjectName);
            expect(buildConfig.certificateSha1).toEqual(config.certificateSha1);
            expect(buildConfig.signingHashAlgorithms).toEqual(config.signingHashAlgorithms);
            expect(buildConfig.additionalCertificateFile).toEqual(config.additionalCertificateFile);
        });

        it('should set buildConfigs in __appendWindowsUserSigning for windows singning when files does not exist.', () => {
            // mock platformConfig, buildConfig and buildOptions Objects
            const platformConfig = {
                windows: { package: ['package', 'package2'], signing: { debug: 'debug', release: 'release', store: 'requirements' } }
            };

            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig, argv: [] };

            const config = {
                debug: 'debug',
                release: 'release',
                identity: 'identify',
                certificateFile: 'certificateFile',
                certificatePassword: 'certificatePassword',
                certificateSubjectName: 'certificateSubjectName',
                certificateSha1: 'certificateSha1',
                signingHashAlgorithms: 'signingHashAlgorithms',
                additionalCertificateFile: 'additionalCertificateFile'
            };

            // create spies
            existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            build.__set__('fs', { existsSync: existsSyncSpy });

            electronBuilder = new ElectronBuilder(buildOptions, api).__appendWindowsUserSigning(config, buildConfig);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalled();

            expect(buildConfig.certificateFile).toEqual(undefined);
            expect(buildConfig.certificatePassword).toEqual(undefined);
            expect(buildConfig.certificateSubjectName).toEqual(config.certificateSubjectName);
            expect(buildConfig.certificateSha1).toEqual(config.certificateSha1);
            expect(buildConfig.signingHashAlgorithms).toEqual(config.signingHashAlgorithms);
            expect(buildConfig.additionalCertificateFile).toEqual(undefined);

            const actualCertificateFile = emitSpy.calls.argsFor(0)[1];
            const expectedCertificateFile = 'The provided certificate file does not exist';
            expect(actualCertificateFile).toContain(expectedCertificateFile);

            const actualAdditionalCertificateFile = emitSpy.calls.argsFor(1)[1];
            const expectedAdditionalCertificateFile = 'The provided addition certificate file does not exist';
            expect(actualAdditionalCertificateFile).toContain(expectedAdditionalCertificateFile);
        });
        it('should call build method.', () => {
            // mock buildOptions Objecet
            const buildOptions = { debug: true, buildConfig: 'build.xml', argv: [] };

            // create spies
            const buildSpy = jasmine.createSpy('build');
            build.__set__('require', () => ({
                build: buildSpy
            }));

            electronBuilder = new ElectronBuilder(buildOptions, api).build();

            expect(buildSpy).toHaveBeenCalled();
        });
    });

    describe('Module exports run', () => {
        it('should have called configure and build.', () => {
            const platformConfig = {
                mac: { arch: ['x64'] }
            };
            const buildConfig = {
                electron: platformConfig,
                author: 'Apache',
                name: 'Guy',
                displayName: 'HelloWorld',
                APP_BUILD_DIR: api.locations.build,
                APP_BUILD_RES_DIR: api.locations.buildRes,
                APP_WWW_DIR: api.locations.www
            };

            const buildOptions = { debug: false, buildConfig: 'LOAD_MY_FAKE_DATA', argv: [] };

            // create spies
            const existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            build.__set__('fs', { existsSync: existsSyncSpy });

            build.__set__('require', (file) => {
                if (file === 'LOAD_MY_FAKE_DATA') return buildConfig;
                if (file === './check_reqs') return { run: () => Promise.resolve([]) };
                return require(file);
            });

            const configureSpy = jasmine.createSpy('configure');
            const buildSpy = jasmine.createSpy('build');

            class ElectronBuilderMock {
                configure () {
                    configureSpy();
                    return this;
                }

                build () {
                    buildSpy();
                    return this;
                }
            }

            build.__set__('ElectronBuilder', ElectronBuilderMock);

            build.run(buildOptions, api).then(() => {
                expect(configureSpy).toHaveBeenCalled();
                expect(buildSpy).toHaveBeenCalled();
            });
        });

        it('should have failed requirement check and thrown error.', () => {
            const buildOptions = { debug: false, buildConfig: 'LOAD_MY_FAKE_DATA', argv: [] };
            const errorMsg = 'error';
            spyOn(check_reqs, 'run').and.callFake(() => Promise.reject(new Error(errorMsg)));

            return build.run(buildOptions, api).then(
                () => fail('Unexpectedly resolved'),
                error => {
                    expect(check_reqs.run).toHaveBeenCalled();
                    expect(error.message).toBe(errorMsg);
                }
            );
        });
    });
});
