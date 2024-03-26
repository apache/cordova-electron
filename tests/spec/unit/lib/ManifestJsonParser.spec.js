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
const { ConfigParser } = require('cordova-common');

const rootDir = path.resolve(__dirname, '../../../..');
const fixturesDir = path.join(rootDir, 'tests/spec/fixtures');

const ManifestJsonParser = rewire(path.join(rootDir, 'lib/ManifestJsonParser'));

// Create a real config object before mocking out everything.
const cfg1 = new ConfigParser(path.join(fixturesDir, 'test-config-1.xml'));
const cfg2 = new ConfigParser(path.join(fixturesDir, 'test-config-2.xml'));
const cfgEmpty = new ConfigParser(path.join(fixturesDir, 'test-config-empty.xml'));

const locations = {
    buildRes: path.join('mock', 'build-res'),
    www: path.join('mock', 'www'),
    configXml: path.join('mock', 'config.xml')
};

const defaultInitManifest = {
    background_color: '#FFF',
    display: 'standalone',
    orientation: 'any',
    start_url: 'index.html'
};

describe('ManifestJson class', () => {
    let manifestJsonParser;

    beforeEach(() => {
        manifestJsonParser = new ManifestJsonParser(locations.www);
    });

    it('should have been constructed with initial values.', () => {
        expect(manifestJsonParser).toBeDefined();
        expect(manifestJsonParser.path).toEqual(path.join(locations.www, 'manifest.json'));
        expect(manifestJsonParser.www).toEqual(locations.www);
        expect(manifestJsonParser.manifest).toEqual(defaultInitManifest);
    });

    it('should return when config xml is not defined.', () => {
        manifestJsonParser.configure();
        expect(manifestJsonParser.manifest).toEqual(defaultInitManifest);
    });

    it('should set manifest json object values to default, when config xml is empty.', () => {
        manifestJsonParser.configure(cfgEmpty);
        expect(manifestJsonParser.manifest).toEqual(jasmine.objectContaining({
            start_url: undefined
        }));
    });

    it('should read and set manifest json object values from the first config xml.', () => {
        manifestJsonParser.configure(cfg1);
        expect(manifestJsonParser.manifest).toEqual(jasmine.objectContaining({
            orientation: 'portrait',
            name: 'HelloWorld',
            short_name: 'HelloWorld',
            version: 'whatever',
            description: 'A sample Apache Cordova application.',
            author: 'Cordova Team',
            icons: [{ src: 'res/electron/cordova.png', type: 'image/png', sizes: '16x16' }]
        }));
    });

    it('should read and set manifest json object values from second config xml.', () => {
        manifestJsonParser.configure(cfg2);
        expect(manifestJsonParser.manifest).toEqual(jasmine.objectContaining({
            orientation: 'landscape',
            name: 'HelloWorld',
            short_name: 'Hello',
            theme_color: '0xff0000ff',
            version: 'whatever',
            description: 'A sample Apache Cordova application.',
            author: 'Cordova Team'
        }));
    });

    it('should update theme color if start_url exists in path and contains meta theme-color.', () => {
        spyOn(fs, 'existsSync').and.returnValue(true);
        spyOn(fs, 'readFileSync').and.returnValue('<meta name="theme-color" content="#33363b">');

        manifestJsonParser.configureThemeColor(cfg1);
        expect(manifestJsonParser.manifest.theme_color).toEqual('#33363b');
    });

    it('should update theme color with StatusBarBackgroundColor if start_url file does not contain meta theme-color.', () => {
        spyOn(fs, 'existsSync').and.returnValue(true);
        spyOn(fs, 'readFileSync').and.returnValue('');

        manifestJsonParser.configureThemeColor(cfg2);
        expect(manifestJsonParser.manifest.theme_color).toEqual('0xff0000ff');
    });

    it('should update theme color with no value when StatusBarBackgroundColor is missing and start_url file does not contain meta theme-color.', () => {
        spyOn(fs, 'existsSync').and.returnValue(true);
        spyOn(fs, 'readFileSync').and.returnValue('');

        manifestJsonParser.configureThemeColor(cfgEmpty);
        expect(manifestJsonParser.manifest.theme_color).toEqual(undefined);
    });

    it('should write something.', () => {
        spyOn(fs, 'writeFileSync').and.returnValue(true);

        manifestJsonParser.write();
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            jasmine.any(String),
            JSON.stringify(defaultInitManifest, null, 2),
            'utf8'
        );
    });

    it('should write defaults with empty config.xml.', () => {
        spyOn(fs, 'writeFileSync').and.returnValue(true);

        manifestJsonParser.configure(cfgEmpty)
            .write();

        const expectedManifest = {
            background_color: '#FFF',
            display: 'standalone',
            orientation: 'any'
        };

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            jasmine.any(String),
            JSON.stringify(expectedManifest, null, 2),
            'utf8'
        );
    });

    it('should write with user defined values from config.xml.', () => {
        spyOn(fs, 'writeFileSync').and.returnValue(true);

        manifestJsonParser.configure(cfg1)
            .write();

        const expectedManifest = {
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

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            jasmine.any(String),
            JSON.stringify(expectedManifest, null, 2),
            'utf8'
        );
    });
});
