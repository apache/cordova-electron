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
const run = rewire('../../../../../../bin/templates/cordova/lib/run');

describe('Run', () => {
    describe('run export method', () => {
        it('should spawn electron with main.js.', () => {
            const _process = run.__get__('process');
            const spawnSpy = jasmine.createSpy('spawn');
            const onSpy = jasmine.createSpy('on');
            const exitSpy = jasmine.createSpy('exit');
            const expectedPathToMain = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'bin', 'templates', 'www', 'main.js');

            run.__set__('electron', 'electron-require');
            run.__set__('process', {
                exit: exitSpy
            });

            run.__set__('proc', {
                spawn: spawnSpy.and.returnValue({
                    on: onSpy.and.callThrough()
                })
            });

            run.run();

            expect(spawnSpy).toHaveBeenCalledWith('electron-require', [expectedPathToMain]);
            expect(onSpy).toHaveBeenCalled();
            expect(exitSpy).not.toHaveBeenCalled();

            // trigger exist as if process was killed
            onSpy.calls.argsFor(0)[1]();
            expect(exitSpy).toHaveBeenCalled();

            run.__set__('process', _process);
        });
    });

    describe('help export method', () => {
        it('should console out run usage.', () => {
            const logSpy = jasmine.createSpy('log');
            run.__set__('console', {
                log: logSpy
            });

            run.help({ binPath: 'foobar' });

            expect(logSpy.calls.argsFor(0)[0]).toContain('Usage');
            expect(logSpy.calls.argsFor(0)[0]).toContain('foobar');
            expect(logSpy.calls.argsFor(0)[0]).toContain('nobuild');
        });
    });
});
