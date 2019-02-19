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
const CordovaError = require('cordova-common').CordovaError;
const Api = require(path.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'bin', 'templates', 'cordova', 'Api'));

/**
 * Create a mock item from the getIcon collection with the supplied updated data.
 *
 * @param {Object} data Changes to apply to the mock getIcon item
 */
function mockGetIconItem (data) {
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

describe('Testing prepare.js:', () => {
    let prepare;

    // Spies
    let emitSpy;
    let updatePathsSpy;

    let cordovaProject;
    let locations;

    beforeEach(() => {
        prepare = rewire(path.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'bin', 'templates', 'cordova', 'lib', 'prepare'));

        locations = {
            buildRes: path.join('mock', 'build-res'),
            www: path.join('mock', 'www'),
            configXml: path.join('mock', 'config.xml'),
            platformRootDir: path.join('mock', 'platform_www')
        };

        cordovaProject = {
            root: 'mock',
            projectConfig: {
                path: path.join('mock', 'config.xml'),
                cdvNamespacePrefix: 'cdv',
                doc: {
                    getroot: function () {
                        return this;
                    }
                }
            },
            locations: locations
        };

        emitSpy = jasmine.createSpy('emit');
        prepare.__set__('events', {
            emit: emitSpy
        });

        updatePathsSpy = jasmine.createSpy('updatePaths');
        prepare.__set__('FileUpdater', {
            updatePaths: updatePathsSpy
        });
    });

    describe('module.exports.prepare method', () => {
        // define spies
        let constructorSpy = jasmine.createSpy('constructor');
        let configureSpy = jasmine.createSpy('configure');
        let writeSpy = jasmine.createSpy('write');
        let mergeXmlSpy = jasmine.createSpy('mergeXml');
        let updateIconsSpy = jasmine.createSpy('updateIcons');

        // define fake classses, methods and variables
        class FakeParser {
            constructor () {
                constructorSpy();
            }
            configure () {
                configureSpy();
                return this;
            }
            write () {
                writeSpy();
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
                constructorSpy();
            }
            write () {
                writeSpy();
                return this;
            }
        }

        const xmlHelpersMock = {
            mergeXml: function () {
                mergeXmlSpy();
                return this;
            }
        };

        const updateIconsFake = () => {
            updateIconsSpy();
            return this;
        };

        it('should generate config.xml from defaults for platform.', () => {
            // Mocking the scope with dummy API;
            Promise.resolve().then(function () {
                const api = new Api(null, '', '');
                this.locations = api.locations;
                this.events = { emit: emitSpy };
                this.config = api.config;
                this.parser = api.parser;
                this.parser.update_www = () => { return this; };
                this.parser.update_project = () => { return this; };

                const defaultConfigPathMock = path.join(api.locations.platformRootDir, 'cordova', 'defaults.xml');
                const ownConfigPathMock = api.locations.configXml;

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (configPath) {
                        return configPath === defaultConfigPathMock;
                    },
                    copySync: copySyncSpy
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('ManifestJsonParser', FakeParser);
                prepare.__set__('PackageJsonParser', FakeParser);
                prepare.__set__('SettingJsonParser', FakeParser);

                prepare.prepare(cordovaProject, {}, api);

                expect(copySyncSpy).toHaveBeenCalledWith(defaultConfigPathMock, ownConfigPathMock);
                expect(mergeXmlSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(constructorSpy).toHaveBeenCalled();
                expect(configureSpy).toHaveBeenCalled();
                expect(writeSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'Generating config.xml';
                expect(actual).toContain(expected);
            });
        });

        it('should generate defaults.xml from own config.xml for platform.', () => {
            // Mocking the scope with dummy API;
            Promise.resolve().then(function () {
                const api = new Api(null, '', '');
                this.locations = api.locations;
                this.events = { emit: emitSpy };
                this.config = api.config;
                this.parser = api.parser;
                this.parser.update_www = () => { return this; };
                this.parser.update_project = () => { return this; };

                const defaultConfigPathMock = path.join(api.locations.platformRootDir, 'cordova', 'defaults.xml');
                const ownConfigPathMock = api.locations.configXml;

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (configPath) {
                        return configPath === ownConfigPathMock;
                    },
                    copySync: copySyncSpy
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('ManifestJsonParser', FakeParser);
                prepare.__set__('PackageJsonParser', FakeParser);
                prepare.__set__('SettingJsonParser', FakeParser);

                prepare.prepare(cordovaProject, {}, api);

                expect(copySyncSpy).toHaveBeenCalledWith(ownConfigPathMock, defaultConfigPathMock);
                expect(mergeXmlSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(constructorSpy).toHaveBeenCalled();
                expect(configureSpy).toHaveBeenCalled();
                expect(writeSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'Generating defaults.xml';
                expect(actual).toContain(expected);
            });
        });

        it('should hit case 3.', () => {
            // Mocking the scope with dummy API;
            Promise.resolve().then(function () {
                const api = new Api(null, '', '');
                this.locations = api.locations;
                this.events = { emit: emitSpy };
                this.config = api.config;
                this.parser = api.parser;
                this.parser.update_www = () => { return this; };
                this.parser.update_project = () => { return this; };

                const defaultConfigPathMock = path.join(api.locations.platformRootDir, 'cordova', 'defaults.xml');
                const ownConfigPathMock = api.locations.configXml;
                const sourceCfgMock = cordovaProject.projectConfig;

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (configPath) {
                        return configPath !== ownConfigPathMock && configPath !== defaultConfigPathMock;
                    },
                    copySync: copySyncSpy
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('ManifestJsonParser', FakeParser);
                prepare.__set__('PackageJsonParser', FakeParser);
                prepare.__set__('SettingJsonParser', FakeParser);

                prepare.prepare(cordovaProject, {}, api);

                expect(copySyncSpy).toHaveBeenCalledWith(sourceCfgMock.path, ownConfigPathMock);
                expect(mergeXmlSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(constructorSpy).toHaveBeenCalled();
                expect(configureSpy).toHaveBeenCalled();
                expect(writeSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(0)[1];
                const expected = 'case 3';
                expect(actual).toContain(expected);
            });
        });

        it('should copy manifest.', () => {
            // Mocking the scope with dummy API;
            Promise.resolve().then(function () {
                const api = new Api(null, '', '');
                this.locations = api.locations;
                this.events = { emit: emitSpy };
                this.config = api.config;
                this.parser = api.parser;
                this.parser.update_www = () => { return this; };
                this.parser.update_project = () => { return this; };

                const srcManifestPathMock = path.join(cordovaProject.locations.www, 'manifest.json');
                const manifestPathMock = path.join(api.locations.www, 'manifest.json');

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (srcManifestPath) {
                        return srcManifestPath === srcManifestPathMock;
                    },
                    copySync: copySyncSpy
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('ManifestJsonParser', FakeParser);
                prepare.__set__('PackageJsonParser', FakeParser);
                prepare.__set__('SettingJsonParser', FakeParser);

                prepare.prepare(cordovaProject, {}, api);

                expect(copySyncSpy).toHaveBeenCalledWith(srcManifestPathMock, manifestPathMock);
                expect(mergeXmlSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(constructorSpy).toHaveBeenCalled();
                expect(configureSpy).toHaveBeenCalled();
                expect(writeSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(1)[1];
                const expected = 'Copying';
                expect(actual).toContain(expected);
            });
        });

        it('should create new manifest file.', () => {
            // Mocking the scope with dummy API;
            Promise.resolve().then(function () {
                const api = new Api(null, '', '');
                this.locations = api.locations;
                this.events = { emit: emitSpy };
                this.config = api.config;
                this.parser = api.parser;
                this.parser.update_www = () => { return this; };
                this.parser.update_project = () => { return this; };

                const srcManifestPathMock = path.join(cordovaProject.locations.www, 'manifest.json');

                const copySyncSpy = jasmine.createSpy('copySync');
                prepare.__set__('fs', {
                    existsSync: function (srcManifestPath) {
                        return srcManifestPath !== srcManifestPathMock;
                    },
                    copySync: copySyncSpy
                });

                // override classes and methods called in modules.export.prepare
                prepare.__set__('ConfigParser', FakeConfigParser);
                prepare.__set__('xmlHelpers', xmlHelpersMock);
                prepare.__set__('updateIcons', updateIconsFake);
                prepare.__set__('ManifestJsonParser', FakeParser);
                prepare.__set__('PackageJsonParser', FakeParser);
                prepare.__set__('SettingJsonParser', FakeParser);

                prepare.prepare(cordovaProject, {}, api);

                expect(mergeXmlSpy).toHaveBeenCalled();
                expect(updateIconsSpy).toHaveBeenCalled();
                expect(constructorSpy).toHaveBeenCalled();
                expect(configureSpy).toHaveBeenCalled();
                expect(writeSpy).toHaveBeenCalled();

                const actual = emitSpy.calls.argsFor(1)[1];
                const expected = 'Creating';
                expect(actual).toContain(expected);
            });
        });
    });

    describe('updateIcons method', () => {

        it('should detect no defined icons.', () => {
            const updateIcons = prepare.__get__('updateIcons');

            cordovaProject.projectConfig.getIcons = () => {
                return [];
            };

            updateIcons(cordovaProject, locations);

            // The emit was called
            expect(emitSpy).toHaveBeenCalled();

            // The emit message was.
            const actual = emitSpy.calls.argsFor(0)[1];
            const expected = 'This app does not have icons defined';
            expect(actual).toEqual(expected);
        });

        it('should update icons.', () => {
            const updateIcons = prepare.__get__('updateIcons');

            // create spies
            const checkIconsAttributesSpy = jasmine.createSpy('checkIconsAttributes');
            prepare.__set__('checkIconsAttributes', checkIconsAttributesSpy);
            const prepareIconsSpy = jasmine.createSpy('prepareIcons');
            prepare.__set__('prepareIcons', prepareIconsSpy);
            const createResourceMapSpy = jasmine.createSpy('createResourceMap');
            prepare.__set__('createResourceMap', createResourceMapSpy);
            const copyIconsSpy = jasmine.createSpy('copyIcons');
            prepare.__set__('copyIcons', copyIconsSpy);

            cordovaProject.projectConfig.getIcons = () => {
                const icon = mockGetIconItem({});
                return [icon];
            };

            updateIcons(cordovaProject, locations);

            // The emit was called
            expect(emitSpy).toHaveBeenCalled();
            expect(checkIconsAttributesSpy).toHaveBeenCalled();
            expect(prepareIconsSpy).toHaveBeenCalled();
            expect(createResourceMapSpy).toHaveBeenCalled();
            expect(copyIconsSpy).toHaveBeenCalled();

            // The emit message was.
            const actual = emitSpy.calls.argsFor(0)[1];
            const expected = 'Updating icons';
            expect(actual).toEqual(expected);
        });
    });

    describe('checkIconsAttributes method', () => {
        let checkIconsAttributes;

        beforeEach(() => {
            checkIconsAttributes = prepare.__get__('checkIconsAttributes');
        });

        it('should detect icons with missing src and throw an error with size=undefined in message.', () => {
            const icons = [
                mockGetIconItem({
                    src: path.join('res', 'electron', 'cordova_512.png'),
                    width: 512,
                    height: 512
                })
            ];

            expect(() => {
                checkIconsAttributes(icons);
            }).not.toThrow(
                new CordovaError()
            );
        });

        it('should detect icons with missing src and throw an error with size=undefined in message.', () => {
            const icons = [
                mockGetIconItem({
                    src: ''
                })
            ];

            expect(() => {
                checkIconsAttributes(icons);
            }).toThrow(
                new CordovaError('One of the following attributes are set but missing the other for the target: size=undefined. Please ensure that all required attributes are defined.')
            );
        });

        it('should detect icons with missing src, but defined size and throw an error with size in message.', () => {
            const icons = [
                mockGetIconItem({
                    src: '',
                    width: 512,
                    height: 512
                })
            ];

            expect(() => {
                checkIconsAttributes(icons);
            }).toThrow(
                new CordovaError('One of the following attributes are set but missing the other for the target: size=512. Please ensure that all required attributes are defined.')
            );
        });

        it('should detect icons with target set, but missing src and throw an error with target in message.', () => {
            const icons = [
                mockGetIconItem({
                    src: '',
                    target: 'installer'
                })
            ];

            expect(() => {
                checkIconsAttributes(icons);
            }).toThrow(
                new CordovaError('One of the following attributes are set but missing the other for the target: installer. Please ensure that all required attributes are defined.')
            );
        });

        it('should detect icons with wrong size defined and throw an error with and sizes in message.', () => {
            const icons = [
                mockGetIconItem({
                    src: path.join('res', 'electron', 'cordova_512.png'),
                    height: 512,
                    width: 256
                })
            ];

            expect(() => {
                checkIconsAttributes(icons);
            }).toThrow(
                new CordovaError('Size of icon does not match required size given: width=256 height=512. Please ensure that .png icon for is at least 512x512.')
            );
        });

        it('should detect icons with wrong size defined for the installer and throw an error with target and sizes in message.', () => {
            const icons = [
                mockGetIconItem({
                    src: path.join('res', 'electron', 'cordova_512.png'),
                    target: 'installer',
                    height: 256,
                    width: 256
                })
            ];

            expect(() => {
                checkIconsAttributes(icons);
            }).toThrow(
                new CordovaError('Size of icon does not match required size for target: installer. Please ensure that .png icon for is at least 512x512.')
            );
        });
    });

    describe('prepareIcons method', () => {
        let prepareIcons;

        beforeEach(() => {
            prepareIcons = prepare.__get__('prepareIcons');
        });

        it('should return array of objects with custom icon, when there is only one icon in res folder.', () => {
            const icons = mockGetIconItem({
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
            const icons = mockGetIconItem({
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
            const icons = mockGetIconItem({
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
            const icon1 = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova.png'),
                width: 512,
                height: 512
            });

            const icon2 = mockGetIconItem({
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
            const icons = mockGetIconItem({
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
            const icons = mockGetIconItem({
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
            const app = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const icons = [ app, installer ];

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
            const app1 = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const app2 = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova_extra.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const installer2 = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova_512_extra.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const icons = [ app1, app2, installer, installer2 ];

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
            const highRes10 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const icons = [ highRes10, highRes15, highRes20, highRes40, highRes80 ];

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
            const installer = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const highRes10 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const icons = [ installer, highRes10, highRes15, highRes20, highRes40, highRes80 ];

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
            findHighResIcons = prepare.__get__('findHighResIcons');
        });

        it('should return array of objects with remaining icons, when there is only one icon in res folder.', () => {
            const icons = mockGetIconItem({
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
            const icons = mockGetIconItem({
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
            const icons = mockGetIconItem({
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
            const icons = mockGetIconItem({
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
            const app = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const icons = [ app, installer ];

            const actual = findHighResIcons(icons);
            const expected = {
                highResIcons: [],
                remainingIcons: icons
            };

            expect(expected).toEqual(actual);
        });

        it('should return remainingIcons array of objects with app and installer icon, when there more one icon with target=app and more than one with target=installer', () => {
            const app = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const installer2 = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova_512_extra.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const icons = [ app, installer, installer2 ];

            const actual = findHighResIcons(icons);
            const expected = {
                highResIcons: [],
                remainingIcons: icons
            };

            expect(expected).toEqual(actual);
        });

        it('should throw Cordova Error when there is no base icon', () => {
            const highRes15 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const icons = [ highRes15, highRes20, highRes40, highRes80 ];

            expect(() => {
                findHighResIcons(icons);
            }).toThrow(
                new CordovaError('Base icon for high resolution images was not found.')
            );
        });

        it('should return array of objects with high resolution icons, if they are defined', () => {
            const highRes10 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const icons = [ highRes10, highRes15, highRes20, highRes40, highRes80 ];

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
            const installer = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const highRes10 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

            const icons = [ installer, highRes10, highRes15, highRes20, highRes40, highRes80 ];

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
            const highRes10 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@8x.png'), target: 'installer' });

            const icons = [ highRes10, highRes15, highRes20, highRes40, highRes80 ];

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
        let shellLsSpy;

        beforeEach(() => {
            createResourceMap = prepare.__get__('createResourceMap');
            shellLsSpy = prepare.__get__('mapIconResources');

            shellLsSpy = jasmine.createSpy('ls').and.returnValue([true]);
            prepare.__set__('shell', { ls: shellLsSpy });
        });

        it('should map custom icon to installer and app icon locations', () => {

            const icon = mockGetIconItem({
                src: path.join('res', 'logo.png'),
                platform: undefined
            });
            let data = {
                customIcon: Object.assign(icon, { extension: '.png' }),
                appIcon: undefined,
                installerIcon: undefined,
                highResIcons: []
            };

            const actual = createResourceMap(cordovaProject, locations, data);

            expect(shellLsSpy).toHaveBeenCalled();

            const expected = [
                { [path.join('res', 'logo.png')]: path.join('mock', 'www', 'img', 'app.png') },
                { [path.join('res', 'logo.png')]: path.join('mock', 'build-res', 'installer.png') }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map installer icon to appoporiate location', () => {
            const icons = mockGetIconItem({
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

            expect(shellLsSpy).toHaveBeenCalled();

            const expected = [
                { [path.join('res', 'electron', 'cordova_512.png')]: path.join('mock', 'build-res', 'installer.png') }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map installer and app icon to appoporiate location', () => {
            const app = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova.png'),
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetIconItem({
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

            expect(shellLsSpy).toHaveBeenCalled();

            const expected = [
                { [path.join('res', 'electron', 'cordova.png')]: path.join('mock', 'www', 'img', 'app.png') },
                { [path.join('res', 'electron', 'cordova_512.png')]: path.join('mock', 'build-res', 'installer.png') }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map high resolution icons to appoporiate location', () => {
            const highRes10 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

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

            expect(shellLsSpy).toHaveBeenCalled();

            const expected = [
                { [path.join('res', 'electron', 'cordova@1.5x.png')]: path.join('mock', 'www', 'img', 'icon@1.5x.png') },
                { [path.join('res', 'electron', 'cordova@2x.png')]: path.join('mock', 'www', 'img', 'icon@2x.png') },
                { [path.join('res', 'electron', 'cordova@4x.png')]: path.join('mock', 'www', 'img', 'icon@4x.png') },
                { [path.join('res', 'electron', 'cordova@8x.png')]: path.join('mock', 'www', 'img', 'icon@8x.png') },
                { [path.join('res', 'electron', 'cordova.png')]: path.join('mock', 'www', 'img', 'icon.png') }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map high resolution icons and installer icon to appoporiate location', () => {
            const installer = mockGetIconItem({
                src: path.join('res', 'electron', 'cordova_512.png'),
                target: 'installer',
                width: 512,
                height: 512
            });
            const highRes10 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova.png') });
            const highRes15 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@1.5x.png') });
            const highRes20 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@2x.png') });
            const highRes40 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@4x.png') });
            const highRes80 = mockGetIconItem({ src: path.join('res', 'electron', 'cordova@8x.png') });

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

            expect(shellLsSpy).toHaveBeenCalled();

            const expected = [
                { [path.join('res', 'electron', 'cordova_512.png')]: path.join('mock', 'build-res', 'installer.png') },
                { [path.join('res', 'electron', 'cordova@1.5x.png')]: path.join('mock', 'www', 'img', 'icon@1.5x.png') },
                { [path.join('res', 'electron', 'cordova@2x.png')]: path.join('mock', 'www', 'img', 'icon@2x.png') },
                { [path.join('res', 'electron', 'cordova@4x.png')]: path.join('mock', 'www', 'img', 'icon@4x.png') },
                { [path.join('res', 'electron', 'cordova@8x.png')]: path.join('mock', 'www', 'img', 'icon@8x.png') },
                { [path.join('res', 'electron', 'cordova.png')]: path.join('mock', 'www', 'img', 'icon.png') }
            ];

            expect(expected).toEqual(actual);
        });

    });

    describe('mapIconResources method', () => {
        let mapIconResources;
        let shellLsSpy;

        beforeEach(() => {
            mapIconResources = prepare.__get__('mapIconResources');
            shellLsSpy = prepare.__get__('mapIconResources');

            shellLsSpy = jasmine.createSpy('ls').and.returnValue([true]);
            prepare.__set__('shell', { ls: shellLsSpy });
        });

        it('should not be called if resource does not exist.', () => {
            mapIconResources(cordovaProject.root, '', '');

            shellLsSpy = jasmine.createSpy('ls').and.returnValue([false]);
            prepare.__set__('shell', { ls: shellLsSpy });

            expect(shellLsSpy).not.toHaveBeenCalled();
        });

        it('should map to file to file', () => {
            const sourcePath = path.join(cordovaProject.root, 'res', 'electron', 'cordova_512.png');
            const targetPath = path.join(cordovaProject.root, 'www', 'img', 'icon.png');

            const expected = {};
            expected[sourcePath] = targetPath;

            const actual = mapIconResources(cordovaProject.root, sourcePath, targetPath);
            expect(shellLsSpy).toHaveBeenCalled();
            expect(expected).toEqual(actual);
        });

        it('should map to folder to folder', () => {
            const sourcePath = path.join(cordovaProject.root, 'res', 'electron');
            const targetPath = path.join(cordovaProject.root, 'www', 'img');

            const expected = {};
            expected[sourcePath] = targetPath;

            const actual = mapIconResources(cordovaProject.root, sourcePath, targetPath);
            expect(shellLsSpy).toHaveBeenCalled();
            expect(expected).toEqual(actual);
        });

    });

    describe('copyIcons method', () => {
        let copyIcons;
        let fsCopySyncSpy;

        beforeEach(() => {
            copyIcons = prepare.__get__('copyIcons');

            fsCopySyncSpy = jasmine.createSpy('copySync');
            prepare.__set__('fs', { copySync: fsCopySyncSpy });
        });

        it('should not copy as no resources provided.', () => {
            copyIcons(cordovaProject.root, [{}]);
            expect(fsCopySyncSpy).not.toHaveBeenCalled();
        });

        it('should copy provided resources.', () => {
            copyIcons(cordovaProject.root, [
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
