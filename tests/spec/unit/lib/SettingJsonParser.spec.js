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
const ConfigParser = require('cordova-common').ConfigParser;

const rootDir = path.resolve(__dirname, '../../../..');
const fixturesDir = path.join(rootDir, 'tests/spec/fixtures');

// Create a real config object before mocking out everything.
const cfg = new ConfigParser(path.join(fixturesDir, 'test-config-1.xml'));
const cfgEmpty = new ConfigParser(path.join(fixturesDir, 'test-config-empty.xml'));
const cfgCustomSchemeHostname = new ConfigParser(path.join(fixturesDir, 'test-config-custom-scheme.xml'));

describe('Testing SettingJsonParser.js:', () => {
    let SettingJsonParser;
    let locations;

    beforeEach(() => {
        SettingJsonParser = rewire(path.join(rootDir, 'lib/SettingJsonParser'));

        locations = {
            buildRes: path.join('mock', 'build-res'),
            www: path.join('mock', 'www'),
            configXml: path.join('mock', 'config.xml')
        };
    });

    describe('SettingJson class', () => {
        let settingJsonParser;
        let requireSpy;
        let options;

        beforeEach(() => {
            settingJsonParser = SettingJsonParser.__get__('SettingJsonParser');

            requireSpy = jasmine.createSpy('require').and.returnValue({});
            settingJsonParser.__set__({ require: requireSpy });
        });

        it('should should be defined.', () => {
            expect(settingJsonParser).toBeDefined();
        });

        it('should be called and package equal to false, if settings json does not exist.', () => {
            requireSpy = jasmine.createSpy('require').and.returnValue(false);
            settingJsonParser.__set__({ require: requireSpy });

            settingJsonParser = new SettingJsonParser(locations.www);

            expect(requireSpy).toHaveBeenCalled();
            expect(settingJsonParser.package).toEqual(false);
        });

        it('should be called and package equal to true, if settings json does exist.', () => {
            settingJsonParser = new SettingJsonParser(locations.www);

            expect(requireSpy).toHaveBeenCalled();
            expect(settingJsonParser.package).toEqual({});
        });

        it('should use default when users settings files does not exist and config.xml is empty, but set devTools value from options', () => {
            options = { options: { release: true, argv: [] } };

            SettingJsonParser.__set__('require', (file) => {
                // return defaults
                if (file.includes('cdv-electron-settings.json')) {
                    return {
                        browserWindow: {
                            webPreferences: {
                                devTools: true,
                                nodeIntegration: true
                            }
                        }
                    };
                }

                return require(file);
            });

            settingJsonParser = new SettingJsonParser(locations.www).configure(cfgEmpty, options.options, false);

            expect(settingJsonParser.package.browserWindow.webPreferences.devTools).toBe(false);
            expect(settingJsonParser.package.browserWindow.webPreferences.nodeIntegration).toBe(true);
        });

        it('should set scheme and hostname to default when not defined.', () => {
            options = { options: { release: true, argv: [] } };

            SettingJsonParser.__set__('require', (file) => {
                // return defaults
                if (file.includes('cdv-electron-settings.json')) {
                    return {
                        browserWindow: {
                            webPreferences: { }
                        }
                    };
                }

                return require(file);
            });

            settingJsonParser = new SettingJsonParser(locations.www).configure(cfgEmpty, options.options, false);

            expect(settingJsonParser.package.scheme).toBe('file');
            expect(settingJsonParser.package.hostname).toBe('localhost');
        });

        it('should set custom scheme and hostname from config.xml.', () => {
            options = { options: { release: true, argv: [] } };

            SettingJsonParser.__set__('require', (file) => {
                // return defaults
                if (file.includes('cdv-electron-settings.json')) {
                    return {
                        browserWindow: {
                            webPreferences: { }
                        }
                    };
                }

                return require(file);
            });

            settingJsonParser = new SettingJsonParser(locations.www).configure(cfgCustomSchemeHostname, options.options, false);

            expect(settingJsonParser.package.scheme).toBe('app');
            expect(settingJsonParser.package.hostname).toBe('cordova');
        });

        it('should use default when users settings files does not exist.', () => {
            options = {};

            SettingJsonParser.__set__('require', (file) => {
                // return defaults
                if (file.includes('cdv-electron-settings.json')) {
                    return {
                        browserWindow: {
                            webPreferences: {
                                devTools: true,
                                nodeIntegration: true
                            }
                        }
                    };
                }

                return require(file);
            });

            settingJsonParser = new SettingJsonParser(locations.www).configure(cfg, options.options, false);

            expect(settingJsonParser.package.browserWindow.webPreferences.devTools).toBe(true);
            expect(settingJsonParser.package.browserWindow.webPreferences.nodeIntegration).toBe(true);
        });

        it('should load users override settings and merge on default, but set devTools value from options.', () => {
            options = { options: { debug: true, argv: [] } };

            SettingJsonParser.__set__('require', (file) => {
                if (file === 'LOAD_MY_FAKE_DATA') {
                    return {
                        browserWindow: {
                            webPreferences: {
                                devTools: false,
                                nodeIntegration: false
                            }
                        }
                    };
                }

                // return defaults
                if (file.includes('cdv-electron-settings.json')) {
                    return {
                        browserWindow: {
                            webPreferences: {
                                devTools: true,
                                nodeIntegration: true
                            }
                        }
                    };
                }

                return require(file);
            });

            settingJsonParser = new SettingJsonParser(locations.www).configure(cfg, options.options, 'LOAD_MY_FAKE_DATA');

            expect(settingJsonParser.package.browserWindow.webPreferences.devTools).toBe(true);
            expect(settingJsonParser.package.browserWindow.webPreferences.nodeIntegration).toBe(false);
        });

        it('should write provided data.', () => {
            const writeFileSyncSpy = jasmine.createSpy('writeFileSync');
            settingJsonParser.__set__('fs', { writeFileSync: writeFileSyncSpy });
            options = { options: { debug: true, argv: [] } };

            SettingJsonParser.__set__('require', (file) => {
                if (file === 'LOAD_MY_FAKE_DATA') return {};

                // return defaults
                if (file.includes('cdv-electron-settings.json')) {
                    return {
                        browserWindow: {
                            webPreferences: {
                                devTools: true,
                                nodeIntegration: true
                            }
                        }
                    };
                }

                return require(file);
            });

            settingJsonParser = new SettingJsonParser(locations.www).configure(cfg, options.options, 'LOAD_MY_FAKE_DATA').write();

            expect(writeFileSyncSpy).toHaveBeenCalled();

            // get settings json file content and remove white spaces
            let settingsFile = writeFileSyncSpy.calls.argsFor(0)[1];
            settingsFile = settingsFile.replace(/\s+/g, '');
            expect(settingsFile).toEqual('{"browserWindow":{"webPreferences":{"devTools":true,"nodeIntegration":true}},"browserWindowInstance":{"loadURL":{"url":"index.html"}},"scheme":"file","hostname":"localhost"}');

            const settingsFormat = writeFileSyncSpy.calls.argsFor(0)[2];
            expect(settingsFormat).toEqual('utf8');
        });
    });
});
