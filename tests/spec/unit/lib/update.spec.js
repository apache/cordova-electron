const rewire = require('rewire');
const update = rewire('../../../../bin/lib/update');

describe('Update', () => {
    describe('run export method', () => {
        it('should reject with an errror that update is not supported.', () => {
            update.run().then(
                () => {},
                (error) => {
                    expect(error).toEqual(new Error('Update not supported'));
                }
            );
        });
    });

    describe('help export method', () => {
        it('should warn that updating is not support for Electron.', () => {
            const logSpy = jasmine.createSpy('log');
            update.__set__('console', {
                log: logSpy
            });

            update.help();

            expect(logSpy.calls.argsFor(0)[0]).toContain('WARNING : Electron does not support updating. Remove and then re-Add the platform to get the latest.');
        });
    });
});
