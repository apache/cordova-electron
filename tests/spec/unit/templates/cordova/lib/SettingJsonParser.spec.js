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

describe('Testing SettingJsonParser.js:', () => {
    let SettingJsonParser;
    let locations;

    beforeEach(() => {
        SettingJsonParser = rewire('../../../../../../bin/templates/cordova/lib/SettingJsonParser');

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

        it('should be equal to undefined, when config file is undefined.', () => {
            // mock options data
            options = { options: { argv: [] } };

            settingJsonParser = new SettingJsonParser(locations.www).configure(undefined);

            expect(requireSpy).toHaveBeenCalled();
            expect(settingJsonParser.package.isRelease).toEqual(undefined);
        });

        it('should be equal to false, when no flag is set.', () => {
            // mock options data
            options = { options: { argv: [] } };

            settingJsonParser = new SettingJsonParser(locations.www).configure(options.options);

            expect(requireSpy).toHaveBeenCalled();
            expect(settingJsonParser.package.isRelease).toEqual(false);
        });

        it('should be equal to false, when debug flag is set.', () => {
            // mock options data
            options = { options: { debug: true, argv: [] } };

            settingJsonParser = new SettingJsonParser(locations.www).configure(options.options);

            expect(requireSpy).toHaveBeenCalled();
            expect(settingJsonParser.package.isRelease).toEqual(false);
        });

        it('should be equal to true, when release flag is set.', () => {
            // mock options data
            options = { options: { release: true, argv: [] } };

            settingJsonParser = new SettingJsonParser(locations.www).configure(options.options);

            expect(requireSpy).toHaveBeenCalled();
            expect(settingJsonParser.package.isRelease).toEqual(true);
        });

        it('should write provided data, when no flag is set.', () => {
            let writeFileSyncSpy;
            writeFileSyncSpy = jasmine.createSpy('writeFileSync');
            settingJsonParser.__set__('fs', { writeFileSync: writeFileSyncSpy });

            options = { options: { argv: [] } };

            settingJsonParser = new SettingJsonParser(locations.www).configure(options.options).write();

            expect(writeFileSyncSpy).toHaveBeenCalled();

            const settingsPath = writeFileSyncSpy.calls.argsFor(0)[0];
            expect(settingsPath).toEqual(path.join('mock', 'www', 'cdv-electron-settings.json'));

            // get settings json file content and remove white spaces
            let settingsFile = writeFileSyncSpy.calls.argsFor(0)[1];
            settingsFile = settingsFile.replace(/\s+/g, '');
            expect(settingsFile).toEqual('{"isRelease":false}');

            const settingsFormat = writeFileSyncSpy.calls.argsFor(0)[2];
            expect(settingsFormat).toEqual('utf8');
        });

        it('should write provided data, when debug flag is set.', () => {
            const writeFileSyncSpy = jasmine.createSpy('writeFileSync');
            settingJsonParser.__set__('fs', { writeFileSync: writeFileSyncSpy });

            options = { options: { debug: true, argv: [] } };

            settingJsonParser = new SettingJsonParser(locations.www).configure(options.options).write();

            expect(writeFileSyncSpy).toHaveBeenCalled();

            const settingsPath = writeFileSyncSpy.calls.argsFor(0)[0];
            expect(settingsPath).toEqual(path.join('mock', 'www', 'cdv-electron-settings.json'));

            // get settings json file content and remove white spaces
            let settingsFile = writeFileSyncSpy.calls.argsFor(0)[1];
            settingsFile = settingsFile.replace(/\s+/g, '');
            expect(settingsFile).toEqual('{"isRelease":false}');

            const settingsFormat = writeFileSyncSpy.calls.argsFor(0)[2];
            expect(settingsFormat).toEqual('utf8');
        });

        it('should write provided data.', () => {
            const writeFileSyncSpy = jasmine.createSpy('writeFileSync');
            settingJsonParser.__set__('fs', { writeFileSync: writeFileSyncSpy });

            options = { options: { release: true, argv: [] } };

            settingJsonParser = new SettingJsonParser(locations.www).configure(options.options).write();

            expect(writeFileSyncSpy).toHaveBeenCalled();

            const settingsPath = writeFileSyncSpy.calls.argsFor(0)[0];
            expect(settingsPath).toEqual(path.join('mock', 'www', 'cdv-electron-settings.json'));

            // get settings json file content and remove white spaces
            let settingsFile = writeFileSyncSpy.calls.argsFor(0)[1];
            settingsFile = settingsFile.replace(/\s+/g, '');
            expect(settingsFile).toEqual('{"isRelease":true}');

            const settingsFormat = writeFileSyncSpy.calls.argsFor(0)[2];
            expect(settingsFormat).toEqual('utf8');
        });
    });
});
