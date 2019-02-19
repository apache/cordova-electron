const rewire = require('rewire');
const run = rewire('../../../../../../bin/templates/cordova/lib/run');

describe('Run', () => {
    describe('run export method', () => {
        it('should spawn electron with main.js.', () => {
            const _process = run.__get__('process');
            const spawnSpy = jasmine.createSpy('spawn');
            const onSpy = jasmine.createSpy('on');
            const exitSpy = jasmine.createSpy('exit');

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

            expect(spawnSpy).toHaveBeenCalledWith('electron-require', ['./platforms/electron/www/main.js']);
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
