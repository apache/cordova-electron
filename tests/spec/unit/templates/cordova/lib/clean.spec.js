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
const clean = rewire('../../../../../../bin/templates/cordova/lib/clean');

describe('Clean', () => {
    describe('run export method', () => {
        it('should stop process when requirement check fails.', () => {
            // get original
            const _process = clean.__get__('process');

            // create spies
            const logSpy = jasmine.createSpy('log');
            const exitSpy = jasmine.createSpy('exit');

            // set spies
            clean.__set__('console', { error: logSpy });
            clean.__set__('check_reqs', {
                run: jasmine.createSpy('run').and.returnValue(false)
            });
            clean.__set__('process', { exit: exitSpy });

            // run test
            clean.run();

            const logArgs = logSpy.calls.argsFor(0)[0];
            const expectedLog = 'Please make sure you meet the software requirements in order to clean an electron cordova project';

            expect(logArgs).toContain(expectedLog);
            expect(exitSpy).toHaveBeenCalledWith(2);

            // Reset
            clean.__set__('process', _process);
        });

        it('should not find previous build dir and not attempt to remove.', () => {
            clean.__set__('check_reqs', {
                run: jasmine.createSpy('run').and.returnValue(true)
            });

            const existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(false);
            const removeSyncSpy = jasmine.createSpy('removeSync');
            clean.__set__('fs', {
                existsSync: existsSyncSpy,
                removeSync: removeSyncSpy
            });

            clean.run();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(removeSyncSpy).not.toHaveBeenCalled();
        });

        it('should find previous build dir and attempt to remove.', () => {
            clean.__set__('check_reqs', {
                run: jasmine.createSpy('run').and.returnValue(true)
            });

            const existsSyncSpy = jasmine.createSpy('existsSync').and.returnValue(true);
            const removeSyncSpy = jasmine.createSpy('removeSync');
            clean.__set__('fs', {
                existsSync: existsSyncSpy,
                removeSync: removeSyncSpy
            });

            clean.run();

            expect(existsSyncSpy).toHaveBeenCalled();
            expect(removeSyncSpy).toHaveBeenCalled();
        });

        it('should find previous build dir and fail to remove.', () => {
            clean.__set__('check_reqs', {
                run: jasmine.createSpy('run').and.returnValue(true)
            });

            clean.__set__('fs', {
                existsSync: jasmine.createSpy('existsSync').and.returnValue(true),
                removeSync: () => {
                    throw 'Fake Error';
                }
            });

            expect(() => {
                clean.run();
            }).toThrow();
        });
    });

    describe('cleanProject export method', () => {
        it('should console out that it will execute run command.', () => {
            const logSpy = jasmine.createSpy('log');
            clean.__set__('console', {
                log: logSpy
            });

            clean.cleanProject();

            expect(logSpy.calls.argsFor(0)[0]).toContain('lib/clean will soon only export a `run` command, please update to not call `cleanProject`.');
        });
    });

    describe('help export method', () => {
        it('should console out clean usage.', () => {
            const logSpy = jasmine.createSpy('log');
            clean.__set__('console', {
                log: logSpy
            });

            clean.help({ binPath: 'foobar' });

            expect(logSpy.calls.argsFor(0)[0]).toContain('Usage');
            expect(logSpy.calls.argsFor(0)[0]).toContain('foobar');
        });
    });
});
