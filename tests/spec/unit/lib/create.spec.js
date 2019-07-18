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

const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const rewire = require('rewire');

const rootDir = path.resolve(__dirname, '../../../..');

function makeTempDir () {
    const dir = path.join(os.tmpdir(), 'cordova-electron-test-');
    return fs.realpathSync(fs.mkdtempSync(dir));
}

describe('create', () => {
    let create, tmpDir;

    beforeEach(() => {
        create = rewire(path.join(rootDir, 'lib/create'));
        tmpDir = makeTempDir();
    });
    afterEach(() => {
        fs.removeSync(tmpDir);
    });

    function createAndValidateProjectDirName (projectname, projectid) {
        const projectPath = path.join(tmpDir, projectname);

        create.__set__('fs', {
            ensureDirSync: fs.ensureDirSync,
            existsSync: path => path !== projectPath,
            copySync: () => true
        });

        return create.createProject(projectPath, projectname, projectid, projectname)
            .then(() => {
                // expects the project name to be the directory name.
                expect(fs.readdirSync(tmpDir).includes(projectname)).toBe(true);
            });
    }

    it('create project with ascii name, no spaces', () => {
        const projectname = 'testcreate';
        const projectid = 'com.test.app1';

        return createAndValidateProjectDirName(projectname, projectid);
    });

    it('create project with ascii name, and spaces', () => {
        const projectname = 'test create';
        const projectid = 'com.test.app2';

        return createAndValidateProjectDirName(projectname, projectid);
    });

    it('create project with unicode name, no spaces', () => {
        const projectname = '応応応応用用用用';
        const projectid = 'com.test.app3';

        return createAndValidateProjectDirName(projectname, projectid);
    });

    it('create project with unicode name, and spaces', () => {
        const projectname = '応応応応 用用用用';
        const projectid = 'com.test.app4';

        return createAndValidateProjectDirName(projectname, projectid);
    });

    it('create project with ascii+unicode name, no spaces', () => {
        const projectname = '応応応応hello用用用用';
        const projectid = 'com.test.app5';

        return createAndValidateProjectDirName(projectname, projectid);
    });

    it('create project with ascii+unicode name, and spaces', () => {
        const projectname = '応応応応 hello 用用用用';
        const projectid = 'com.test.app6';

        return createAndValidateProjectDirName(projectname, projectid);
    });

    it('should stop creating project when project destination already exists', () => {
        create.__set__('fs', {
            existsSync: jasmine.createSpy('existsSync').and.returnValue(true)
        });

        const projectname = 'alreadyexist';
        const projectid = 'com.test.alreadyexist';

        expect(() => {
            create.createProject(tmpDir, projectname, projectid, projectname);
        }).toThrowError(/destination already exists/);
    });

    it('should stop creating project when requirement check fails', () => {
        create.__set__('check_reqs', {
            run: jasmine.createSpy('check_reqs').and.returnValue(false)
        });

        const emitSpy = jasmine.createSpy('emit');
        create.__set__('events', {
            emit: emitSpy
        });

        const projectname = 'reqfail';
        const projectid = 'com.test.reqfail';

        create.createProject(tmpDir, projectname, projectid, projectname);

        expect(emitSpy).toHaveBeenCalledWith('error', 'Please make sure you meet the software requirements in order to build a cordova electron project');
    });
});
