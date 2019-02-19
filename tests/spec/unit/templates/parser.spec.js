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
const Parser = rewire('../../../../bin/templates/cordova/parser');

describe('Parser class', () => {
    describe('Constructing parser instanse', () => {
        const mockProjectPath = 'mock_project_path';

        it('should not have valid electron project', () => {
            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(false));

            expect(() => new Parser(mockProjectPath)).toThrow(
                new CordovaError(`The provided path "${mockProjectPath}" is not a valid electron project.`)
            );
        });

        it('should have valid electron project and set path', () => {
            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(true));

            let parser = new Parser(mockProjectPath);

            expect(parser.path).toBe(mockProjectPath);
        });
    });

    describe('update_from_config method', () => {
        const mockProjectPath = 'mock_project_path';

        it('should return a resolved promise.', () => {
            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(true));

            let parser = new Parser(mockProjectPath);
            const actual = parser.update_from_config();

            expect(typeof actual).toBe(typeof Promise.resolve());
        });
    });

    describe('www_dir method', () => {
        const mockProjectPath = 'mock_project_path';

        it('should return the projects www dir path.', () => {
            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(true));

            let parser = new Parser(mockProjectPath);
            const actual = parser.www_dir();

            expect(actual).toBe(path.join(mockProjectPath, 'www'));
        });
    });

    describe('update_www method', () => {
        const mockProjectPath = 'mock_project_path';

        it('should detect merges/electron file path and merge/update user source files into the platform staging dir', () => {
            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(true));

            const fsExistsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            Parser.__set__('fs', {
                existsSync: fsExistsSyncSpy
            });

            const emitSpy = jasmine.createSpy('emit');
            Parser.__set__('events', {
                emit: emitSpy
            });

            const mergeAndUpdateDirSpy = jasmine.createSpy('mergeAndUpdateDir');
            Parser.__set__('FileUpdater', {
                mergeAndUpdateDir: mergeAndUpdateDirSpy
            });

            let parser = new Parser(mockProjectPath);

            const cordovaProject = {
                root: 'mock',
                projectConfig: {
                    path: path.join('mock', 'config.xml'),
                    cdvNamespacePrefix: 'cdv'
                },
                locations: {
                    www: path.join('mock', 'www')
                }
            };

            parser.update_www(cordovaProject);

            expect(fsExistsSyncSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalled();

            // The emit message was.
            let actualEmit = emitSpy.calls.argsFor(0)[1];
            let expectedEmit = 'Found "merges/electron" folder. Copying its contents into the electron project.';
            expect(actualEmit).toBe(expectedEmit);

            let expectedSourceDirs = [
                'www',
                path.join('..', mockProjectPath, 'platform_www'),
                path.join('merges', 'electron')
            ];
            let expectedTargetDir = path.join('..', mockProjectPath, 'www');
            actualEmit = emitSpy.calls.argsFor(1)[1];
            expectedEmit = `Merging and updating files from [${expectedSourceDirs.join(', ')}] to ${expectedTargetDir}`;
            expect(actualEmit).toBe(expectedEmit);

            expect(mergeAndUpdateDirSpy).toHaveBeenCalled();
        });

        it('should detect merges/electron file path and merge/update user source files into the platform staging dir', () => {
            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(true));

            const fsExistsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            Parser.__set__('fs', {
                existsSync: fsExistsSyncSpy
            });

            const emitSpy = jasmine.createSpy('emit');
            Parser.__set__('events', {
                emit: emitSpy
            });

            const mergeAndUpdateDirSpy = jasmine.createSpy('mergeAndUpdateDir');
            Parser.__set__('FileUpdater', {
                mergeAndUpdateDir: mergeAndUpdateDirSpy
            });

            let parser = new Parser(mockProjectPath);

            const cordovaProject = {
                root: 'mock',
                projectConfig: {
                    path: path.join('mock', 'config.xml'),
                    cdvNamespacePrefix: 'cdv'
                },
                locations: {
                    www: path.join('mock', 'www')
                }
            };

            parser.update_www(cordovaProject);

            expect(fsExistsSyncSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalled();

            // The emit message was.
            let actualEmit = emitSpy.calls.argsFor(0)[1];
            let expectedEmit = 'Found "merges/electron" folder. Copying its contents into the electron project.';
            expect(actualEmit).not.toBe(expectedEmit);

            let expectedSourceDirs = [
                'www',
                path.join('..', mockProjectPath, 'platform_www')
            ];
            let expectedTargetDir = path.join('..', mockProjectPath, 'www');
            actualEmit = emitSpy.calls.argsFor(0)[1];
            expectedEmit = `Merging and updating files from [${expectedSourceDirs.join(', ')}] to ${expectedTargetDir}`;
            expect(actualEmit).toBe(expectedEmit);

            expect(mergeAndUpdateDirSpy).toHaveBeenCalled();
        });
    });

    describe('config_xml method', () => {
        const mockProjectPath = 'mock_project_path';

        it('should return the projects config.xml file path.', () => {
            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(true));

            let parser = new Parser(mockProjectPath);
            const actual = parser.config_xml();

            expect(actual).toBe(path.join(mockProjectPath, 'config.xml'));
        });
    });

    describe('update_project method', () => {
        const mockProjectPath = 'mock_project_path';

        it('should copy munged config.xml to platform www dir.', () => {
            const fsCopySyncSpy = jasmine.createSpy('copySync');
            Parser.__set__('fs', {
                copySync: fsCopySyncSpy
            });

            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(true));

            let parser = new Parser(mockProjectPath);

            parser.update_project().then(() => {
                expect(fsCopySyncSpy).toHaveBeenCalled();

                const actualSrc = fsCopySyncSpy.calls.argsFor(0)[0];
                const actualDest = fsCopySyncSpy.calls.argsFor(0)[1];
                expect(actualSrc).toBe(path.join(mockProjectPath, 'config.xml'));
                expect(actualDest).toBe(path.join(mockProjectPath, 'www', 'config.xml'));
            });
        });
    });

    describe('logFileOp method', () => {
        it('should emit passed in message.', () => {
            const emitSpy = jasmine.createSpy('emit');
            Parser.__set__('events', {
                emit: emitSpy
            });

            const msg = 'random message';
            const logFileOp = Parser.__get__('logFileOp');
            logFileOp(msg);

            // The emit message was.
            let actualEmit = emitSpy.calls.argsFor(0)[1];
            expect(emitSpy).toHaveBeenCalled();
            expect(actualEmit).toBe(`  ${msg}`);
        });
    });
});
