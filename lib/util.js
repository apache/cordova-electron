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

let _packageJson = null;

module.exports.deepMerge = (mergeTo, mergeWith) => {
    for (const property in mergeWith) {
        if ((property === '__proto__' || property === 'constructor' || property === 'prototype')) {
            continue;
        }

        if (Object.prototype.toString.call(mergeWith[property]) === '[object Object]') {
            mergeTo[property] = module.exports.deepMerge((mergeTo[property] || {}), mergeWith[property]);
        } else if (Object.prototype.toString.call(mergeWith[property]) === '[object Array]') {
            mergeTo[property] = [].concat((mergeTo[property] || []), mergeWith[property]);
        } else {
            mergeTo[property] = mergeWith[property];
        }
    }

    return mergeTo;
};

/**
 * Gets the `cordova-electron` package.json file.
 * The path to the file depends on if called from a unit testing or an actual Cordova project.
 *
 * @return {Object} package.json content
 */
module.exports.getPackageJson = () => {
    if (_packageJson) return _packageJson;

    try {
        // coming from user project
        _packageJson = require(require.resolve('cordova-electron/package.json'));
    } catch (e) {
        // coming from repo test & coho
        _packageJson = require('../package.json');
    }

    return _packageJson;
};
