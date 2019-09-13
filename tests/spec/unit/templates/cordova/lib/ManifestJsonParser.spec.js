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
const ConfigParser = require('cordova-common').ConfigParser;

const FIXTURES = path.join(__dirname, '..', '..', '..', '..', 'fixtures');

// Create a real config object before mocking out everything.
const cfg1 = new ConfigParser(path.join(FIXTURES, 'test-config-1.xml'));
const cfg2 = new ConfigParser(path.join(FIXTURES, 'test-config-2.xml'));
const cfgEmpty = new ConfigParser(path.join(FIXTURES, 'test-config-empty.xml'));

describe('Testing ManifestJsonParser.js:', () => {
    let ManifestJsonParser;
    let locations;

    beforeEach(() => {
        ManifestJsonParser = rewire('../../../../../../bin/templates/cordova/lib/ManifestJsonParser');

        locations = {
            buildRes: path.join('mock', 'build-res'),
            www: path.join('mock', 'www'),
            configXml: path.join('mock', 'config.xml')
        };
    });

    describe('ManifestJson class', () => {
        let manifestJsonParser;

        beforeEach(() => {
            manifestJsonParser = ManifestJsonParser.__get__('ManifestJsonParser');
        });

        it('should should be defined.', () => {
            expect(manifestJsonParser).toBeDefined();
        });

        it('should set initial value correctly.', () => {
            manifestJsonParser = new ManifestJsonParser(locations.www);

            // mock manifest JSON Object
            const manifestJsonObj = {
                background_color: '#FFF',
                display: 'standalone',
                orientation: 'any',
                start_url: 'index.html'
            };

            expect(manifestJsonParser.path).toEqual(path.join('mock', 'www', 'manifest.json'));
            expect(manifestJsonParser.www).toEqual(locations.www);
            expect(manifestJsonParser.manifest).toEqual(manifestJsonObj);
        });

        it('should return when config xml is not defined.', () => {
            manifestJsonParser = new ManifestJsonParser(locations.www).configure(undefined);

            // mock manifest JSON Object
            const manifestJsonObj = {
                background_color: '#FFF',
                display: 'standalone',
                orientation: 'any',
                start_url: 'index.html'
            };

            expect(manifestJsonParser.manifest).toEqual(manifestJsonObj);
        });

        it('should set manifest json object values to default, when config xml is empty.', () => {
            manifestJsonParser = new ManifestJsonParser(locations.www).configure(cfgEmpty);

            // mock manifest JSON Object
            const manifestJsonObj = {
                background_color: '#FFF',
                display: 'standalone',
                orientation: 'any',
                start_url: undefined,
                icons: []
            };

            expect(manifestJsonParser.manifest).toEqual(manifestJsonObj);
        });

        it('should read and set manifest json object values from the first config xml.', () => {
            manifestJsonParser = new ManifestJsonParser(locations.www).configure(cfg1);

            // mock manifest JSON Object
            const manifestJsonObj = {
                background_color: '#FFF',
                display: 'standalone',
                orientation: 'portrait',
                start_url: 'index.html',
                name: 'HelloWorld',
                short_name: 'HelloWorld',
                version: 'whatever',
                description: 'A sample Apache Cordova application.',
                author: 'Cordova Team',
                icons: [{ src: 'res/electron/cordova.png', type: 'image/png', sizes: '16x16' }]
            };
            expect(manifestJsonParser.manifest).toEqual(manifestJsonObj);
        });

        it('should read and set manifest json object values from second config xml.', () => {
            manifestJsonParser = new ManifestJsonParser(locations.www).configure(cfg2);

            // mock manifest JSON Object
            const manifestJsonObj = {
                background_color: '#FFF',
                display: 'standalone',
                orientation: 'landscape',
                start_url: 'index.html',
                name: 'HelloWorld',
                short_name: 'Hello',
                theme_color: '0xff0000ff',
                version: 'whatever',
                description: 'A sample Apache Cordova application.',
                author: 'Cordova Team',
                icons: []
            };
            expect(manifestJsonParser.manifest).toEqual(manifestJsonObj);
        });

        it('should be called if start_url is defined in config xml.', () => {
            const existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            const readFileSyncSpy = jasmine.createSpy('readFileSync').and.returnValue('<meta name="theme-color" content="#33363b">');
            manifestJsonParser.__set__('fs', { readFileSync: readFileSyncSpy, existsSync: existsSyncSpy });

            manifestJsonParser = new ManifestJsonParser(locations.www).configureThemeColor(cfg1);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(readFileSyncSpy).toHaveBeenCalled();
        });

        it('should not be called if start_url is not defined in config xml.', () => {
            const existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            const readFileSyncSpy = jasmine.createSpy('readFileSync');
            manifestJsonParser.__set__('fs', { readFileSync: readFileSyncSpy, existsSync: existsSyncSpy });

            manifestJsonParser = new ManifestJsonParser(locations.www).configureThemeColor(cfgEmpty);

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(readFileSyncSpy).toHaveBeenCalled();
        });

        it('should write provided data when config xml is empty.', () => {
            const existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            const readFileSyncSpy = jasmine.createSpy('readFileSync');
            const writeFileSyncSpy = jasmine.createSpy('writeFileSync');
            manifestJsonParser.__set__('fs', { readFileSync: readFileSyncSpy, existsSync: existsSyncSpy, writeFileSync: writeFileSyncSpy });

            manifestJsonParser = new ManifestJsonParser(locations.www).configure(cfgEmpty).write();

            expect(existsSyncSpy).not.toHaveBeenCalled();
            expect(readFileSyncSpy).not.toHaveBeenCalled();
            expect(writeFileSyncSpy).toHaveBeenCalled();

            // mock manifest JSON Object
            let manifestJsonObj = {
                background_color: '#FFF',
                display: 'standalone',
                orientation: 'any',
                icons: []
            };

            const manifestPath = writeFileSyncSpy.calls.argsFor(0)[0];
            expect(manifestPath).toEqual(path.join('mock', 'www', 'manifest.json'));

            // get manifest json file content and remove white spaces
            let manifestFile = writeFileSyncSpy.calls.argsFor(0)[1];

            // convert to remove white space
            manifestFile = manifestFile.replace(/\s+/g, '');
            manifestJsonObj = JSON.stringify(manifestJsonObj).replace(/\s/g, '');
            expect(manifestFile).toEqual(manifestJsonObj);

            const manifestFormat = writeFileSyncSpy.calls.argsFor(0)[2];
            expect(manifestFormat).toEqual('utf8');
        });

        it('should write manifest json object values from config xml.', () => {
            const existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            const readFileSyncSpy = jasmine.createSpy('readFileSync');
            const writeFileSyncSpy = jasmine.createSpy('writeFileSync');
            manifestJsonParser.__set__('fs', { readFileSync: readFileSyncSpy, existsSync: existsSyncSpy, writeFileSync: writeFileSyncSpy });

            manifestJsonParser = new ManifestJsonParser(locations.www).configure(cfg1).write();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(readFileSyncSpy).toHaveBeenCalled();
            expect(writeFileSyncSpy).toHaveBeenCalled();

            // mock manifest JSON Object
            let manifestJsonObj = {
                background_color: '#FFF',
                display: 'standalone',
                orientation: 'portrait',
                start_url: 'index.html',
                name: 'HelloWorld',
                short_name: 'HelloWorld',
                version: 'whatever',
                description: 'A sample Apache Cordova application.',
                author: 'Cordova Team',
                icons: [{ src: 'res/electron/cordova.png', type: 'image/png', sizes: '16x16' }]
            };

            const manifestPath = writeFileSyncSpy.calls.argsFor(0)[0];
            expect(manifestPath).toEqual(path.join('mock', 'www', 'manifest.json'));

            // get manifest json file content and remove white spaces
            let manifestFile = writeFileSyncSpy.calls.argsFor(0)[1];

            // convert to remove white space
            manifestFile = manifestFile.replace(/\s+/g, '');
            manifestJsonObj = JSON.stringify(manifestJsonObj).replace(/\s/g, '');
            expect(manifestFile).toEqual(manifestJsonObj);

            const manifestFormat = writeFileSyncSpy.calls.argsFor(0)[2];
            expect(manifestFormat).toEqual('utf8');
        });

    });
});
