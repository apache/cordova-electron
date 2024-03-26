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
const rewire = require('rewire');
const { CordovaError, events } = require('cordova-common');

const rootDir = path.resolve(__dirname, '../../../..');

const Parser = rewire(path.join(rootDir, 'lib/parser'));

const mockProjectPath = 'mock_project_path';

describe('Parser class', () => {
    describe('Constructing parser instanse', () => {
        it('should not have valid electron project', () => {
            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(false));

            expect(() => new Parser(mockProjectPath)).toThrow(
                new CordovaError(`The provided path "${mockProjectPath}" is not a valid electron project.`)
            );
        });

        it('should have valid electron project and set path', () => {
            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(true));
            const parser = new Parser(mockProjectPath);
            expect(parser.path).toBe(mockProjectPath);
        });
    });

    describe('Class Methods', () => {
        let parser;

        beforeEach(() => {
            Parser.__set__('dirExists', jasmine.createSpy('dirExists').and.returnValue(true));
            parser = new Parser(mockProjectPath);
        });

        describe('update_from_config method', () => {
            it('should return a resolved promise.', () => {
                const actual = parser.update_from_config();
                expect(typeof actual).toBe(typeof Promise.resolve());
            });
        });

        describe('www_dir method', () => {
            it('should return the projects www dir path.', () => {
                const actual = parser.www_dir();
                expect(actual).toBe(path.join(mockProjectPath, 'www'));
            });
        });

        describe('update_www method', () => {
            const mockConfigParser = {
                root: 'mock',
                projectConfig: {
                    path: path.join('mock', 'config.xml'),
                    cdvNamespacePrefix: 'cdv'
                },
                locations: {
                    www: path.join('mock', 'www')
                }
            };

            it('should detect merges/electron file path and merge/update user source files into the platform staging dir', () => {
                spyOn(fs, 'existsSync').and.returnValue(true);
                spyOn(events, 'emit');

                const mergeAndUpdateDirSpy = jasmine.createSpy('mergeAndUpdateDir');
                Parser.__set__('FileUpdater', {
                    mergeAndUpdateDir: mergeAndUpdateDirSpy
                });

                parser.update_www(mockConfigParser);

                expect(events.emit).toHaveBeenCalledWith(
                    'verbose',
                    'Found "merges/electron" folder. Copying its contents into the electron project.'
                );

                const expectedSourceDirs = [
                    'www',
                    path.join('..', mockProjectPath, 'platform_www'),
                    path.join('merges', 'electron')
                ];
                const expectedTargetDir = path.join('..', mockProjectPath, 'www');

                expect(events.emit).toHaveBeenCalledWith(
                    'verbose',
                    `Merging and updating files from [${expectedSourceDirs.join(', ')}] to ${expectedTargetDir}`
                );

                expect(mergeAndUpdateDirSpy).toHaveBeenCalled();
            });

            it('should detect merges/electron file path and merge/update user source files into the platform staging dir', () => {
                spyOn(fs, 'existsSync').and.returnValue(false);
                spyOn(events, 'emit');

                const mergeAndUpdateDirSpy = jasmine.createSpy('mergeAndUpdateDir');
                Parser.__set__('FileUpdater', {
                    mergeAndUpdateDir: mergeAndUpdateDirSpy
                });

                parser.update_www(mockConfigParser);

                expect(fs.existsSync).toHaveBeenCalled();
                expect(events.emit).toHaveBeenCalled();

                // The emit message was.
                let actualEmit = events.emit.calls.argsFor(0)[1];
                let expectedEmit = 'Found "merges/electron" folder. Copying its contents into the electron project.';
                expect(actualEmit).not.toBe(expectedEmit);

                const expectedSourceDirs = [
                    'www',
                    path.join('..', mockProjectPath, 'platform_www')
                ];
                const expectedTargetDir = path.join('..', mockProjectPath, 'www');
                actualEmit = events.emit.calls.argsFor(0)[1];
                expectedEmit = `Merging and updating files from [${expectedSourceDirs.join(', ')}] to ${expectedTargetDir}`;
                expect(actualEmit).toBe(expectedEmit);
                expect(mergeAndUpdateDirSpy).toHaveBeenCalled();
            });
        });

        describe('config_xml method', () => {
            it('should return the projects config.xml file path.', () => {
                expect(parser.config_xml()).toBe(path.join(mockProjectPath, 'config.xml'));
            });
        });

        describe('update_project method', () => {
            it('should copy munged config.xml to platform www dir.', () => {
                const cpSyncSpy = jasmine.createSpy('cpSync');
                Parser.__set__('fs', { cpSync: cpSyncSpy });

                parser.update_project().then(() => {
                    const actualSrc = cpSyncSpy.calls.argsFor(0)[0];
                    const actualDest = cpSyncSpy.calls.argsFor(0)[1];

                    expect(cpSyncSpy).toHaveBeenCalled();
                    expect(actualSrc).toBe(path.join(mockProjectPath, 'config.xml'));
                    expect(actualDest).toBe(path.join(mockProjectPath, 'www', 'config.xml'));
                });
            });
        });
    });

    describe('logFileOp method', () => {
        it('should emit passed in message.', () => {
            spyOn(events, 'emit');

            const msg = 'random message';
            const logFileOp = Parser.__get__('logFileOp');
            logFileOp(msg);

            // The emit message was.
            const actualEmit = events.emit.calls.argsFor(0)[1];
            expect(events.emit).toHaveBeenCalled();
            expect(actualEmit).toBe(`  ${msg}`);
        });
    });
});
