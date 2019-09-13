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

const shell = require('shelljs');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const rewire = require('rewire');

const cordova_bin = path.join(__dirname, '../../../bin');// is this the same on all platforms?
const tmpDir = path.join(__dirname, '../../../temp');
const createScriptPath = path.join(cordova_bin, 'create');
const create = rewire(path.join(cordova_bin, 'lib', 'create'));

function createAndVerify (projectname, projectid) {
    let return_code = 0;

    // remove existing folder
    fs.removeSync(tmpDir);
    fs.ensureDirSync(tmpDir);

    // create the project
    const command = util.format('"%s" "%s/%s" "%s" "%s"', createScriptPath, tmpDir, projectname, projectid, projectname);

    return_code = shell.exec(command).code;
    expect(return_code).toBe(0);

    var tempCordovaScriptsPath = path.join(tmpDir, projectname, 'cordova');

    console.log('tempCordovaScriptsPath = ' + tempCordovaScriptsPath);

    // created project has scripts in the cordova folder
    // build, clean, log, run, version
    expect(fs.existsSync(path.join(tempCordovaScriptsPath, 'build'))).toBe(true);
    expect(fs.existsSync(path.join(tempCordovaScriptsPath, 'clean'))).toBe(true);
    expect(fs.existsSync(path.join(tempCordovaScriptsPath, 'log'))).toBe(true);
    expect(fs.existsSync(path.join(tempCordovaScriptsPath, 'run'))).toBe(true);
    expect(fs.existsSync(path.join(tempCordovaScriptsPath, 'version'))).toBe(true);

    // clean-up
    fs.removeSync(tmpDir);
}

function createAndValidateProjectDirName (projectname, projectid) {
    // remove existing folder
    fs.removeSync(tmpDir);
    fs.ensureDirSync(tmpDir);

    const projectPath = path.join(tmpDir, projectname);

    const _fs = create.__get__('fs');
    create.__set__('fs', {
        ensureDirSync: _fs.ensureDirSync,
        existsSync: path => !(path === projectPath),
        copySync: () => true
    });

    return create.createProject(projectPath, projectname, projectid, projectname)
        .then(() => {
            // expects the project name to be the directory name.
            expect(_fs.readdirSync(tmpDir).includes(projectname)).toBe(true);

            fs.removeSync(tmpDir);
            create.__set__('fs', _fs);
        });
}

describe('create', () => {
    it('has a create script in bin/cordova', () => {
        expect(fs.existsSync(createScriptPath)).toBe(true);
    });

    it('create project and check for bin files', () => {
        const projectname = 'testcreate';
        const projectid = 'com.test.app1';

        createAndVerify(projectname, projectid);
    });

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
        const _fs = create.__get__('fs');
        create.__set__('fs', {
            existsSync: jasmine.createSpy('existsSync').and.returnValue(true)
        });

        const projectname = 'alreadyexist';
        const projectid = 'com.test.alreadyexist';

        expect(() => {
            create.createProject(tmpDir, projectname, projectid, projectname);
        }).toThrowError(/destination already exists/);

        create.__set__('fs', _fs);
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

        // clean-up
        fs.removeSync(tmpDir);
    });
});
