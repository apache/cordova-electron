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

const rootDir = path.resolve(__dirname, '../../../..');

const clean = require(path.join(rootDir, 'lib/clean'));
const check_reqs = require(path.join(rootDir, 'lib/check_reqs'));

describe('Clean', () => {
    describe('run export method', () => {
        it('should stop process when requirement check fails.', () => {
            // set spies
            spyOn(console, 'error');
            spyOn(check_reqs, 'run').and.returnValue(false);
            spyOn(process, 'exit');

            // run test
            clean.run();

            const expectedLog = 'Please make sure you meet the software requirements in order to clean an electron cordova project';

            expect(console.error).toHaveBeenCalledWith(expectedLog);
            expect(process.exit).toHaveBeenCalledWith(2);
        });

        it('should not find previous build dir and not attempt to remove.', () => {
            spyOn(check_reqs, 'run').and.returnValue(true);
            spyOn(fs, 'existsSync').and.returnValue(false);
            spyOn(fs, 'rmSync');

            clean.run();

            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.rmSync).not.toHaveBeenCalled();
        });

        it('should find previous build dir and attempt to remove.', () => {
            spyOn(check_reqs, 'run').and.returnValue(true);
            spyOn(fs, 'existsSync').and.returnValue(true);
            spyOn(fs, 'rmSync');

            clean.run();

            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.rmSync).toHaveBeenCalled();
        });

        it('should find previous build dir and fail to remove.', () => {
            spyOn(console, 'log');
            spyOn(check_reqs, 'run').and.returnValue(true);
            spyOn(fs, 'existsSync').and.returnValue(true);
            spyOn(fs, 'rmSync').and.callFake(() => {
                throw new Error('Fake Error');
            });

            clean.run();

            expect(console.log).toHaveBeenCalledWith(
                jasmine.stringMatching(/could not remove/)
            );
        });
    });

    describe('cleanProject export method', () => {
        it('should console out that it will execute run command.', () => {
            spyOn(console, 'log');

            clean.cleanProject();

            expect(console.log).toHaveBeenCalledWith('lib/clean will soon only export a `run` command, please update to not call `cleanProject`.');
        });
    });
});
