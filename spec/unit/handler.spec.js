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

const handler = require('../../bin/template/cordova/handler');
const fs = require('fs-extra');
const path = require('path');

describe('Asset install tests', () => {
    const asset = { itemType: 'asset', src: 'someSrc/ServiceWorker.js', target: 'ServiceWorker.js' };
    const plugin_dir = 'pluginDir';
    const wwwDest = 'dest';
    const cpPath = path.join(plugin_dir, asset.src);
    let fsstatMock;

    it('if src is a directory, should be called with cp, -Rf', () => {
        const copySync = spyOn(fs, 'copySync').and.returnValue('-Rf');
        fsstatMock = { isDirectory: () => true };
        spyOn(fs, 'statSync').and.returnValue(fsstatMock);
        handler.asset.install(asset, plugin_dir, wwwDest);
        expect(copySync).toHaveBeenCalledWith(jasmine.any(String), path.join('dest', asset.target));
    });

    it('if src is not a directory, should be called with cp, -f', () => {
        const copySync = spyOn(fs, 'copySync').and.returnValue('-f');
        fsstatMock = { isDirectory: () => false };
        spyOn(fs, 'statSync').and.returnValue(fsstatMock);
        handler.asset.install(asset, plugin_dir, wwwDest);
        expect(copySync).toHaveBeenCalledWith(cpPath, path.join('dest', asset.target));
    });
});
