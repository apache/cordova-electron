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

const rootDir = path.resolve(__dirname, '../../../..');

const apiStub = Object.freeze({
    locations: Object.freeze({ www: 'FAKE_WWW' })
});

const expectedPathToMain = path.join(apiStub.locations.www, 'cdv-electron-main.js');
const expectedExecaOptions = { windowsHide: false, stdio: 'inherit' };

const run = rewire(path.join(rootDir, 'lib/run'));

describe('Run', () => {
    describe('run export method', () => {
        it('should run electron with cdv-electron-main.js.', () => {
            const execaSpy = jasmine.createSpy('execa');
            const onSpy = jasmine.createSpy('on');

            run.__set__('electron', 'electron-require');
            spyOn(process, 'exit');

            run.__set__('execa', execaSpy.and.returnValue({
                on: onSpy.and.callThrough()
            }));

            run.run.call(apiStub);

            expect(execaSpy).toHaveBeenCalledWith('electron-require', [expectedPathToMain], expectedExecaOptions);
            expect(onSpy).toHaveBeenCalled();
            expect(process.exit).not.toHaveBeenCalled();

            // trigger exist as if process was killed
            onSpy.calls.argsFor(0)[1]();
            expect(process.exit).toHaveBeenCalled();
        });

        it('should pass arguments to electron', () => {
            const execaSpy = jasmine.createSpy('execa');
            const onSpy = jasmine.createSpy('on');
            const expectedElectronArguments = [
                '--inspect-brk=5858',
                expectedPathToMain
            ];

            run.__set__('electron', 'electron-require');
            spyOn(process, 'exit');

            run.__set__('execa', execaSpy.and.returnValue({
                on: onSpy.and.callThrough()
            }));

            run.run.call(apiStub, { argv: ['--inspect-brk=5858'] });

            expect(execaSpy).toHaveBeenCalledWith('electron-require', expectedElectronArguments, expectedExecaOptions);
            expect(onSpy).toHaveBeenCalled();
            expect(process.exit).not.toHaveBeenCalled();

            // trigger exist as if process was killed
            onSpy.calls.argsFor(0)[1]();
            expect(process.exit).toHaveBeenCalled();
        });
    });
});
