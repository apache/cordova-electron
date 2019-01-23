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
const CordovaError = require('cordova-common').CordovaError;

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
        prepare = rewire('../../../../../../bin/templates/cordova/lib/prepare');

        cordovaProject = {
            root: '/mock',
            projectConfig: {
                path: '/mock/config.xml',
                cdvNamespacePrefix: 'cdv'
            }
        };

        locations = {
            buildRes: '/mock/build-res',
            www: '/mock/www'
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
                    src: 'res/electron/cordova_512.png',
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
                    src: 'res/electron/cordova_512.png',
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
                src: 'res/logo.png',
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
                src: 'res/electron/logo.png'
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
                src: 'res/electron/cordova_512.png',
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

        it('should return array of objects with installer icon, when icon is defined for target=installer', () => {
            const icons = mockGetIconItem({
                src: 'res/electron/cordova_512.png',
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
                src: 'res/electron/cordova.png',
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetIconItem({
                src: 'res/electron/cordova_512.png',
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
            const app = mockGetIconItem({
                src: 'res/electron/cordova.png',
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetIconItem({
                src: 'res/electron/cordova_512.png',
                target: 'installer',
                width: 512,
                height: 512
            });
            const installer2 = mockGetIconItem({
                src: 'res/electron/cordova_512_extra.png',
                target: 'installer',
                width: 512,
                height: 512
            });
            const icons = [ app, installer, installer2 ];

            let actual = prepareIcons(icons);
            let expected = {
                customIcon: undefined,
                appIcon: Object.assign(app, { extension: '.png' }),
                installerIcon: Object.assign(installer2, { extension: '.png' }),
                highResIcons: []
            };

            expect(expected).toEqual(actual);

            // The emit was called
            expect(emitSpy).toHaveBeenCalled();

            // The emit message was.
            actual = emitSpy.calls.argsFor(0)[1];
            expected = 'Found extra icon for target installer: res/electron/cordova_512.png and ignoring in favor of res/electron/cordova_512_extra.png.';
            expect(actual).toEqual(expected);
        });

        it('should return array of objects with high resolution icons, if they are defined', () => {
            const highRes10 = mockGetIconItem({ src: 'res/electron/cordova.png' });
            const highRes15 = mockGetIconItem({ src: 'res/electron/cordova@1.5x.png' });
            const highRes20 = mockGetIconItem({ src: 'res/electron/cordova@2x.png' });
            const highRes40 = mockGetIconItem({ src: 'res/electron/cordova@4x.png' });
            const highRes80 = mockGetIconItem({ src: 'res/electron/cordova@8x.png' });

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
                src: 'res/electron/cordova_512.png',
                target: 'installer',
                width: 512,
                height: 512
            });
            const highRes10 = mockGetIconItem({ src: 'res/electron/cordova.png' });
            const highRes15 = mockGetIconItem({ src: 'res/electron/cordova@1.5x.png' });
            const highRes20 = mockGetIconItem({ src: 'res/electron/cordova@2x.png' });
            const highRes40 = mockGetIconItem({ src: 'res/electron/cordova@4x.png' });
            const highRes80 = mockGetIconItem({ src: 'res/electron/cordova@8x.png' });

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
                src: 'res/logo.png',
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
                src: 'res/electron/logo.png'
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
                src: 'res/electron/cordova_512.png',
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
                src: 'res/electron/cordova_512.png',
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
                src: 'res/electron/cordova.png',
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetIconItem({
                src: 'res/electron/cordova_512.png',
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
                src: 'res/electron/cordova.png',
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetIconItem({
                src: 'res/electron/cordova_512.png',
                target: 'installer',
                width: 512,
                height: 512
            });
            const installer2 = mockGetIconItem({
                src: 'res/electron/cordova_512_extra.png',
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
            const highRes15 = mockGetIconItem({ src: 'res/electron/cordova@1.5x.png' });
            const highRes20 = mockGetIconItem({ src: 'res/electron/cordova@2x.png' });
            const highRes40 = mockGetIconItem({ src: 'res/electron/cordova@4x.png' });
            const highRes80 = mockGetIconItem({ src: 'res/electron/cordova@8x.png' });

            const icons = [ highRes15, highRes20, highRes40, highRes80 ];

            expect(() => {
                findHighResIcons(icons);
            }).toThrow(
                new CordovaError('Base icon for high resolution images was not found.')
            );
        });

        it('should return array of objects with high resolution icons, if they are defined', () => {
            const highRes10 = mockGetIconItem({ src: 'res/electron/cordova.png' });
            const highRes15 = mockGetIconItem({ src: 'res/electron/cordova@1.5x.png' });
            const highRes20 = mockGetIconItem({ src: 'res/electron/cordova@2x.png' });
            const highRes40 = mockGetIconItem({ src: 'res/electron/cordova@4x.png' });
            const highRes80 = mockGetIconItem({ src: 'res/electron/cordova@8x.png' });

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
                src: 'res/electron/cordova_512.png',
                target: 'installer',
                width: 512,
                height: 512
            });
            const highRes10 = mockGetIconItem({ src: 'res/electron/cordova.png' });
            const highRes15 = mockGetIconItem({ src: 'res/electron/cordova@1.5x.png' });
            const highRes20 = mockGetIconItem({ src: 'res/electron/cordova@2x.png' });
            const highRes40 = mockGetIconItem({ src: 'res/electron/cordova@4x.png' });
            const highRes80 = mockGetIconItem({ src: 'res/electron/cordova@8x.png' });

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
            const highRes10 = mockGetIconItem({ src: 'res/electron/cordova.png' });
            const highRes15 = mockGetIconItem({ src: 'res/electron/cordova@1.5x.png' });
            const highRes20 = mockGetIconItem({ src: 'res/electron/cordova@2x.png' });
            const highRes40 = mockGetIconItem({ src: 'res/electron/cordova@4x.png' });
            const highRes80 = mockGetIconItem({ src: 'res/electron/cordova@8x.png', target: 'installer' });

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
                src: 'res/logo.png',
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
                { 'res/logo.png': '/mock/www/img/app.png' },
                { 'res/logo.png': '/mock/build-res/installer.png' }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map installer icon to appoporiate location', () => {
            const icons = mockGetIconItem({
                src: 'res/electron/cordova_512.png',
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
                { 'res/electron/cordova_512.png': '/mock/build-res/installer.png' }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map installer and app icon to appoporiate location', () => {
            const app = mockGetIconItem({
                src: 'res/electron/cordova.png',
                target: 'app',
                width: 512,
                height: 512
            });
            const installer = mockGetIconItem({
                src: 'res/electron/cordova_512.png',
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
                { 'res/electron/cordova.png': '/mock/www/img/app.png' },
                { 'res/electron/cordova_512.png': '/mock/build-res/installer.png' }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map high resolution icons to appoporiate location', () => {
            const highRes10 = mockGetIconItem({ src: 'res/electron/cordova.png' });
            const highRes15 = mockGetIconItem({ src: 'res/electron/cordova@1.5x.png' });
            const highRes20 = mockGetIconItem({ src: 'res/electron/cordova@2x.png' });
            const highRes40 = mockGetIconItem({ src: 'res/electron/cordova@4x.png' });
            const highRes80 = mockGetIconItem({ src: 'res/electron/cordova@8x.png' });

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
                { 'res/electron/cordova@1.5x.png': '/mock/www/img/icon@1.5x.png' },
                { 'res/electron/cordova@2x.png': '/mock/www/img/icon@2x.png' },
                { 'res/electron/cordova@4x.png': '/mock/www/img/icon@4x.png' },
                { 'res/electron/cordova@8x.png': '/mock/www/img/icon@8x.png' },
                { 'res/electron/cordova.png': '/mock/www/img/icon.png' }
            ];

            expect(expected).toEqual(actual);
        });

        it('should map high resolution icons and installer icon to appoporiate location', () => {
            const installer = mockGetIconItem({
                src: 'res/electron/cordova_512.png',
                target: 'installer',
                width: 512,
                height: 512
            });
            const highRes10 = mockGetIconItem({ src: 'res/electron/cordova.png' });
            const highRes15 = mockGetIconItem({ src: 'res/electron/cordova@1.5x.png' });
            const highRes20 = mockGetIconItem({ src: 'res/electron/cordova@2x.png' });
            const highRes40 = mockGetIconItem({ src: 'res/electron/cordova@4x.png' });
            const highRes80 = mockGetIconItem({ src: 'res/electron/cordova@8x.png' });

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
                { 'res/electron/cordova_512.png': '/mock/build-res/installer.png' },
                { 'res/electron/cordova@1.5x.png': '/mock/www/img/icon@1.5x.png' },
                { 'res/electron/cordova@2x.png': '/mock/www/img/icon@2x.png' },
                { 'res/electron/cordova@4x.png': '/mock/www/img/icon@4x.png' },
                { 'res/electron/cordova@8x.png': '/mock/www/img/icon@8x.png' },
                { 'res/electron/cordova.png': '/mock/www/img/icon.png' }
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
            const sourcePath = `${cordovaProject.root}/res/electron/cordova_512.png`;
            const targetPath = `${cordovaProject.root}/www/img/icon.png`;

            const expected = {};
            expected[sourcePath] = targetPath;

            const actual = mapIconResources(cordovaProject.root, sourcePath, targetPath);

            expect(shellLsSpy).toHaveBeenCalled();

            expect(expected).toEqual(actual);
        });

        it('should map to folder to folder', () => {
            const sourcePath = `${cordovaProject.root}/res/electron/`;
            const targetPath = `${cordovaProject.root}/www/img/`;

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
            copyIcons(cordovaProject.root, []);
            expect(fsCopySyncSpy).not.toHaveBeenCalled();
        });

        it('should copy provided resources.', () => {
            copyIcons(cordovaProject.root, [
                { 'res/electron/cordova_512.png': `${cordovaProject.root}/build-res/installer.png` },
                { 'res/electron/cordova.png': `${cordovaProject.root}/www/img/icon.png` }
            ]);

            expect(fsCopySyncSpy).toHaveBeenCalled();

            const installerIconSrcPathTest = fsCopySyncSpy.calls.argsFor(0)[0];
            const installerIconDestPathTest = fsCopySyncSpy.calls.argsFor(0)[1];
            expect(installerIconSrcPathTest).toBe(`${cordovaProject.root}/res/electron/cordova_512.png`);
            expect(installerIconDestPathTest).toBe(`${cordovaProject.root}/build-res/installer.png`);

            const appIconSrcPathTest = fsCopySyncSpy.calls.argsFor(1)[0];
            const appIconDestPathTest = fsCopySyncSpy.calls.argsFor(1)[1];
            expect(appIconSrcPathTest).toBe(`${cordovaProject.root}/res/electron/cordova.png`);
            expect(appIconDestPathTest).toBe(`${cordovaProject.root}/www/img/icon.png`);
        });
    });
});
