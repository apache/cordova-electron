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

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { ConfigParser, events } = require('cordova-common');

const rootDir = path.resolve(__dirname, '../../../..');
const fixturesDir = path.join(rootDir, 'tests/spec/fixtures');

const PackageJsonParser = require(path.join(rootDir, 'lib/PackageJsonParser'));

// Create a real config object before mocking out everything.
const cfg = new ConfigParser(path.join(fixturesDir, 'test-config-1.xml'));
const cfgEmpty = new ConfigParser(path.join(fixturesDir, 'test-config-empty.xml'));
const cfgNoAuthorCustomEmail = new ConfigParser(path.join(fixturesDir, 'test-config-no-author-custom-email.xml'));

const defaultMockProjectPackageJson = {
    name: 'io.cordova.electronTest',
    displayName: 'electronTest',
    version: '1.0.0',
    description: 'A Sample Apache Cordova Electron Application.',
    author: 'Apache Cordova Team',
    license: 'Apache-2.0',
    dependencies: {
        'cordova-electron': '^1.0.0',
        'cordova-plugin-camera': '^1.0.0'
    },
    devDependencies: {},
    cordova: {
        plugins: {},
        platforms: ['electron']
    }
};

const defaultInitPackageObj = { main: 'cdv-electron-main.js' };

describe('PackageJsonParser class', () => {
    let packageJsonParser;
    let locations;
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cordovaElectronTest-'));

        locations = {
            buildRes: path.join(tmpDir, 'build-res'),
            www: path.join(tmpDir, 'www'),
            configXml: path.join(tmpDir, 'config.xml')
        };

        packageJsonParser = new PackageJsonParser(locations.www, '/root/project');
        spyOn(events, 'emit');
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should have been constructed with initial values.', () => {
        expect(packageJsonParser).toBeDefined();
        expect(packageJsonParser.path).toEqual(path.join(locations.www, 'package.json'));
        expect(packageJsonParser.www).toEqual(locations.www);
        expect(packageJsonParser.package).toEqual(defaultInitPackageObj);
    });

    it('should not modify the package object when config is not provided.', () => {
        packageJsonParser.configure();
        // the package object should be the same as it was initialized
        expect(packageJsonParser.package).toEqual(defaultInitPackageObj);
    });

    it('should not modify the package object when config is not provided.', () => {
        packageJsonParser.configure();
        // the package object should be the same as it was initialized
        expect(packageJsonParser.package).toEqual(defaultInitPackageObj);
    });

    it('should not add dev tools extension when enable argument = false.', () => {
        packageJsonParser.enableDevTools(false);
        // the package object should be the same as it was initialized
        expect(packageJsonParser.package.dependencies).not.toBeDefined();
    });

    it('should remove dev tools extension when enable argument = false.', () => {
        packageJsonParser.package.dependencies = packageJsonParser.package.dependencies || {
            'electron-devtools-installer': '1.0.0' // test
        };
        // Ensure mock was set, this is acting as if it was set before.
        expect(packageJsonParser.package.dependencies['electron-devtools-installer']).toBeDefined();
        // This should remove the mock
        packageJsonParser.enableDevTools(false);
        // the dependency should have been removed.
        expect(packageJsonParser.package.dependencies['electron-devtools-installer']).not.toBeDefined();
    });

    it('should not add dev tools extension when enable argument = undefined.', () => {
        packageJsonParser.enableDevTools();
        // the package object should be the same as it was initialized
        expect(packageJsonParser.package.dependencies).not.toBeDefined();
    });

    it('should add dev tools extension when enable argument = true.', () => {
        packageJsonParser.enableDevTools(true);
        // the package object should be the same as it was initialized
        expect(packageJsonParser.package.dependencies).toBeDefined();
        expect(packageJsonParser.package.dependencies['electron-devtools-installer']).toBeDefined();
    });

    it('should not create dependencies object if it exists an enable argument = true.', () => {
        packageJsonParser.package.dependencies = {}; // mocking that the object already exists
        packageJsonParser.enableDevTools(true);
        // the package object should be the same as it was initialized
        expect(packageJsonParser.package.dependencies).toBeDefined();
        expect(packageJsonParser.package.dependencies['electron-devtools-installer']).toBeDefined();
    });

    it('should update the package object with default values, when config.xml is empty.', () => {
        packageJsonParser.configure(cfgEmpty, defaultMockProjectPackageJson);

        // Expected Mock Package Object
        const packageJsonObj = Object.assign({}, defaultInitPackageObj, {
            name: 'io.cordova.hellocordova',
            displayName: 'HelloCordova',
            version: '1.0.0',
            description: 'A sample Apache Cordova application that responds to the deviceready event.',
            homepage: 'https://cordova.io',
            license: 'Apache-2.0',
            author: 'Apache Cordova Team'
        });

        expect(packageJsonParser.package).toEqual(packageJsonObj);
    });

    it('should update package object with values from config.xml.', () => {
        packageJsonParser.configure(cfg, defaultMockProjectPackageJson);

        // Expected Mock Package Object
        const packageJsonObj = Object.assign({}, defaultInitPackageObj, {
            name: 'whatever',
            displayName: 'HelloWorld',
            version: '1.1.1',
            description: 'A sample Apache Cordova application.',
            homepage: 'http://cordova.io',
            license: 'Apache 2.0 License',
            author: { name: 'Cordova Team', email: 'dev@cordova.com' }
        });

        expect(packageJsonParser.package).toEqual(packageJsonObj);
    });

    it('should set default author when missing but author email is defined.', () => {
        packageJsonParser.configure(cfgNoAuthorCustomEmail, defaultMockProjectPackageJson);
        expect(packageJsonParser.package.author).toEqual({
            name: 'Apache Cordova Team',
            email: 'dev@cordova.com'
        });
    });

    it('should write something.', () => {
        spyOn(fs, 'writeFileSync').and.returnValue(true);
        packageJsonParser.write();

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            jasmine.any(String),
            JSON.stringify(defaultInitPackageObj, null, 2),
            'utf8'
        );
    });

    it('should write package object out with user custom defined values.', () => {
        spyOn(fs, 'writeFileSync').and.returnValue(true);
        packageJsonParser.configure(cfg, defaultMockProjectPackageJson)
            .write();

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            jasmine.any(String),
            jasmine.stringMatching(/whatever/),
            'utf8'
        );
    });
});

describe('PackageJsonParser (2) class', () => {
    it('should have constructed and already detected directories and files', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cordovaElectronTest-'));
        const locations = {
            buildRes: path.join(tmpDir, 'build-res'),
            www: path.join(tmpDir, 'www'),
            configXml: path.join(tmpDir, 'config.xml')
        };
        const wwwDir = locations.www;
        const pkgFile = path.join(wwwDir, 'package.json');

        fs.mkdirSync(wwwDir, { recursive: true });
        fs.writeFileSync(pkgFile, '{}', 'utf8');

        spyOn(events, 'emit');
        spyOn(fs, 'readFileSync');

        // files & directories should already exisy
        expect(fs.existsSync(wwwDir)).toBeTruthy();
        expect(fs.existsSync(pkgFile)).toBeTruthy();

        /* eslint-disable-next-line */
        const packageJsonParser = new PackageJsonParser(wwwDir, '/root/project');

        expect(fs.readFileSync).toHaveBeenCalled();
        // There should be no change in truthy values.
        expect(fs.existsSync(wwwDir)).toBeTruthy();
        expect(fs.existsSync(pkgFile)).toBeTruthy();

        expect(packageJsonParser.package).toBeDefined();

        fs.rmSync(tmpDir, { recursive: true, force: true });
    });
});
