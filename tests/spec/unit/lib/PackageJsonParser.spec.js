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

const path = require('path');
const fs = require('fs-extra');
const rewire = require('rewire');
const { ConfigParser, events } = require('cordova-common');

const rootDir = path.resolve(__dirname, '../../../..');
const fixturesDir = path.join(rootDir, 'tests/spec/fixtures');

const PackageJsonParser = rewire(path.join(rootDir, 'lib/PackageJsonParser'));

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

const locations = {
    buildRes: path.join('mock', 'build-res'),
    www: path.join('mock', 'www'),
    configXml: path.join('mock', 'config.xml')
};

const defaultInitPackageObj = { main: 'cdv-electron-main.js' };

describe('PackageJsonParser class', () => {
    let packageJsonParser;

    beforeEach(() => {
        packageJsonParser = new PackageJsonParser(locations.www, '/root/project');
        spyOn(events, 'emit');
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
            dependencies: {
                'cordova-electron': '^1.0.0',
                'cordova-plugin-camera': '^1.0.0'
            },
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
            dependencies: {
                'cordova-electron': '^1.0.0',
                'cordova-plugin-camera': '^1.0.0'
            },
            homepage: 'http://cordova.io',
            license: 'Apache 2.0 License',
            author: { name: 'Cordova Team', email: 'dev@cordova.com' }
        });

        expect(packageJsonParser.package).toEqual(packageJsonObj);
    });

    it('should warn when any of the dependencies contain cordova-* is defined but not for cordova-plugin-*.', () => {
        packageJsonParser.configure(cfg, defaultMockProjectPackageJson);

        expect(events.emit).toHaveBeenCalledWith(
            'warn',
            jasmine.stringMatching(/^\[Cordova Electron\] The built package size/)
        );

        expect(events.emit).toHaveBeenCalledWith(
            'verbose',
            jasmine.stringMatching(/The following Cordova package\(s\) were detected/)
        );

        expect(events.emit).toHaveBeenCalledWith(
            'verbose',
            jasmine.stringMatching(/cordova-electron/)
        );

        expect(events.emit).not.toHaveBeenCalledWith(
            'verbose',
            jasmine.stringMatching(/cordova-plugin-camera/)
        );
    });

    it('should set default author when missing but author email is defined.', () => {
        packageJsonParser.configure(cfgNoAuthorCustomEmail, defaultMockProjectPackageJson);
        expect(packageJsonParser.package.author).toEqual({
            name: 'Apache Cordova Team',
            email: 'dev@cordova.com'
        });
    });

    it('should not warn when any cordova-* packages are defined as devDependency.', () => {
        // Fix defaultMockProjectPackageJson where cordova-* is devDependency
        const mockProjectPackageJson = Object.assign({}, defaultMockProjectPackageJson);
        mockProjectPackageJson.devDependencies = Object.assign({}, defaultMockProjectPackageJson.dependencies);
        mockProjectPackageJson.dependencies = { foobar: '1.0.0' }; // setting a non "cordova-" dependency

        packageJsonParser.configure(cfg, mockProjectPackageJson);

        expect(events.emit).not.toHaveBeenCalled();
    });

    it('should skip configuring the Electron app\'s dependencies when the Cordova project\'s package.json dependencies are not set.', () => {
        const mockProjectPackageJson = Object.assign({}, defaultMockProjectPackageJson);
        mockProjectPackageJson.dependencies = {};

        packageJsonParser.configure(cfg, mockProjectPackageJson);

        expect(events.emit).not.toHaveBeenCalled();
    });

    it('should skip preparing npm packages that already contain absolute paths.', () => {
        const mockProjectPackageJson = Object.assign({}, defaultMockProjectPackageJson);
        mockProjectPackageJson.dependencies = { foobar: 'file:/tmp/foobar.tar.gz' };

        packageJsonParser.configure(cfg, mockProjectPackageJson);

        expect(events.emit).not.toHaveBeenCalled();
    });

    it('should convert npm packages that contain relative path to be absolute paths.', () => {
        const mockProjectPackageJson = Object.assign({}, defaultMockProjectPackageJson);
        mockProjectPackageJson.dependencies = { foobar: 'file:../tmp/foobar.tar.gz' };

        spyOn(fs, 'pathExistsSync').and.returnValue(true);

        packageJsonParser.configure(cfg, mockProjectPackageJson);

        expect(events.emit).not.toHaveBeenCalled();
    });

    it('should warn that an npm packages will be dropped when the absolute path could not be found.', () => {
        const mockProjectPackageJson = Object.assign({}, defaultMockProjectPackageJson);
        mockProjectPackageJson.dependencies = { foobar: 'file:../tmp/foobar.tar.gz' };

        spyOn(fs, 'pathExistsSync').and.returnValue(false);

        packageJsonParser.configure(cfg, mockProjectPackageJson);

        expect(events.emit).toHaveBeenCalledWith(
            'warn',
            jasmine.stringMatching(/^\[Cordova Electron\] The following local npm dependencies could not be located and will not be deployed/)
        );

        expect(events.emit).toHaveBeenCalledWith(
            'warn',
            jasmine.stringMatching(/foobar/)
        );
    });

    it('should not set package dependencies when project dependencies is missing.', () => {
        const mockProjectPackageJson = Object.assign({}, defaultMockProjectPackageJson);
        mockProjectPackageJson.devDependencies = Object.assign({}, defaultMockProjectPackageJson.dependencies);
        delete mockProjectPackageJson.dependencies;

        packageJsonParser.configure(cfg, mockProjectPackageJson);

        expect(events.emit).not.toHaveBeenCalled();
        expect(packageJsonParser.package.dependencies).not.toBeDefined();
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
