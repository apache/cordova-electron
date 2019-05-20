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
const cfg = new ConfigParser(path.join(FIXTURES, 'test-config-1.xml'));
const cfgEmpty = new ConfigParser(path.join(FIXTURES, 'test-config-empty.xml'));

describe('Testing PackageJsonParser.js:', () => {
    let PackageJsonParser;
    let locations;

    beforeEach(() => {
        PackageJsonParser = rewire('../../../../../../bin/templates/cordova/lib/PackageJsonParser');

        locations = {
            buildRes: path.join('mock', 'build-res'),
            www: path.join('mock', 'www'),
            configXml: path.join('mock', 'config.xml')
        };
    });

    describe('PackageJson class', () => {
        let packageJsonParser;

        beforeEach(() => {
            packageJsonParser = PackageJsonParser.__get__('PackageJsonParser');
        });

        it('should should be defined.', () => {
            expect(packageJsonParser).toBeDefined();
        });

        it('should set initial value correctly.', () => {
            packageJsonParser = new PackageJsonParser(locations.www);

            // mock package JSON Object
            const packageJsonObj = { main: 'cdv-electron-main.js' };

            expect(packageJsonParser.path).toEqual(path.join('mock', 'www', 'package.json'));
            expect(packageJsonParser.www).toEqual(locations.www);
            expect(packageJsonParser.package).toEqual(packageJsonObj);
        });

        it('should return when config.xml file is not defined.', () => {
            packageJsonParser = new PackageJsonParser(locations.www).configure(undefined);

            // mock package JSON Object
            const packageJsonObj = { main: 'cdv-electron-main.js' };

            expect(packageJsonParser.package).toEqual(packageJsonObj);
        });

        it('should set package json object values to default, when config.xml file is empty.', () => {
            packageJsonParser = new PackageJsonParser(locations.www).configure(cfgEmpty);

            // mock package JSON Object
            const packageJsonObj = {
                package:
                    {
                        main: 'cdv-electron-main.js',
                        name: 'io.cordova.hellocordova',
                        displayName: 'HelloCordova',
                        version: '1.0.0',
                        description: 'A sample Apache Cordova application that responds to the deviceready event.',
                        homepage: 'https://cordova.io',
                        license: 'Apache-2.0',
                        author: 'Apache Cordova Team'
                    }
            };

            expect(packageJsonParser.package).toEqual(packageJsonObj.package);
        });

        it('should read and set package json object values from config.xml file.', () => {
            packageJsonParser = new PackageJsonParser(locations.www).configure(cfg);

            // mock package JSON Object
            const packageJsonObj = {
                package:
                    {
                        main: 'cdv-electron-main.js',
                        name: 'whatever',
                        displayName: 'HelloWorld',
                        version: '1.1.1',
                        description: 'A sample Apache Cordova application.',
                        homepage: 'http://cordova.io',
                        license: 'Apache 2.0 License',
                        author: { name: 'Cordova Team', email: 'dev@cordova.com' }
                    }
            };

            expect(packageJsonParser.package).toEqual(packageJsonObj.package);
        });

        it('should write provided data when config.xml is empty.', () => {
            const writeFileSyncSpy = jasmine.createSpy('writeFileSync');
            packageJsonParser.__set__('fs', { writeFileSync: writeFileSyncSpy });

            packageJsonParser = new PackageJsonParser(locations.www).configure(cfgEmpty).write();

            expect(writeFileSyncSpy).toHaveBeenCalled();

            // mock package JSON Object
            let packageJsonObj = {
                package:
                    {
                        main: 'cdv-electron-main.js',
                        name: 'io.cordova.hellocordova',
                        displayName: 'HelloCordova',
                        version: '1.0.0',
                        description: 'A sample Apache Cordova application that responds to the deviceready event.',
                        homepage: 'https://cordova.io',
                        license: 'Apache-2.0',
                        author: 'Apache Cordova Team'
                    }
            };

            const packagePath = writeFileSyncSpy.calls.argsFor(0)[0];
            expect(packagePath).toEqual(path.join('mock', 'www', 'package.json'));

            // get package json file content and remove white spaces
            let packageFile = writeFileSyncSpy.calls.argsFor(0)[1];

            // convert to remove white space
            packageFile = packageFile.replace(/\s+/g, '');
            packageJsonObj = JSON.stringify(packageJsonObj.package).replace(/\s/g, '');
            expect(packageFile).toEqual(packageJsonObj);

            const packageFormat = writeFileSyncSpy.calls.argsFor(0)[2];
            expect(packageFormat).toEqual('utf8');
        });

        it('should write package json object values from config.xml file.', () => {
            const writeFileSyncSpy = jasmine.createSpy('writeFileSync');
            packageJsonParser.__set__('fs', { writeFileSync: writeFileSyncSpy });

            packageJsonParser = new PackageJsonParser(locations.www).configure(cfg).write();

            expect(writeFileSyncSpy).toHaveBeenCalled();

            // mock package JSON Object
            let packageJsonObj = {
                package:
                    {
                        main: 'cdv-electron-main.js',
                        name: 'whatever',
                        displayName: 'HelloWorld',
                        version: '1.1.1',
                        description: 'A sample Apache Cordova application.',
                        homepage: 'http://cordova.io',
                        license: 'Apache 2.0 License',
                        author: { name: 'CordovaTeam', email: 'dev@cordova.com' }
                    }
            };

            const packagePath = writeFileSyncSpy.calls.argsFor(0)[0];
            expect(packagePath).toEqual(path.join('mock', 'www', 'package.json'));

            // get package.json file content and remove white spaces
            let packageFile = writeFileSyncSpy.calls.argsFor(0)[1];

            // convert to remove white space
            packageFile = packageFile.replace(/\s+/g, '');
            packageJsonObj = JSON.stringify(packageJsonObj.package).replace(/\s/g, '');
            expect(packageFile).toEqual(packageJsonObj);

            const packageFormat = writeFileSyncSpy.calls.argsFor(0)[2];
            expect(packageFormat).toEqual('utf8');
        });
    });
});
