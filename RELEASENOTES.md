<!--
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
-->

## Release Notes for Cordova Electron

### 1.1.1 (Aug 20, 2019)

* [GH-94](https://github.com/apache/cordova-electron/pull/94) chore: rebuilt `package-lock.json` for audit fix
* [GH-79](https://github.com/apache/cordova-electron/pull/79) fix: filter icons only matching requirements
* [GH-89](https://github.com/apache/cordova-electron/pull/89) fix: prepare missing dependencies failure
* [GH-86](https://github.com/apache/cordova-electron/pull/86) refactor: improve create test spec speed
* [GH-85](https://github.com/apache/cordova-electron/pull/85) fix: use `spyOn` for process global var

### 1.1.0 (Jun 28, 2019)

* [GH-77](https://github.com/apache/cordova-electron/pull/77) fix: display correct package version in CLI
* [GH-76](https://github.com/apache/cordova-electron/pull/76) Append Overridable/Top-Level per Platform Options
* [GH-75](https://github.com/apache/cordova-electron/pull/75) fix: Typo in Build: `Singning` -> `Signing`
* [GH-71](https://github.com/apache/cordova-electron/pull/71) Update `devDependencies`
* [GH-66](https://github.com/apache/cordova-electron/pull/66) Bump dependency `fs-extra@^8.0.1`
* [GH-70](https://github.com/apache/cordova-electron/pull/70) Bump `cordova-common@^3.2.0`
* [GH-65](https://github.com/apache/cordova-electron/pull/65) Fixed `package.json` version to `1.1.0-dev`
* [GH-62](https://github.com/apache/cordova-electron/pull/62) Fix Bundle Feature's Project Path Issue & Warning Output
* [GH-58](https://github.com/apache/cordova-electron/pull/58) Set Author Name and Email to `package.json`
* [GH-54](https://github.com/apache/cordova-electron/pull/54) Added Bundle Node Module Support
* [GH-57](https://github.com/apache/cordova-electron/pull/57) Remove Maintainer Option from Linux Build JSON
* [GH-59](https://github.com/apache/cordova-electron/pull/59) Allow Users to Set Linux App Category
* [GH-51](https://github.com/apache/cordova-electron/pull/51) Append package top-level key options
* [GH-48](https://github.com/apache/cordova-electron/pull/48) Implement Splash Screen handling
* [GH-61](https://github.com/apache/cordova-electron/pull/61) Updated `DOCUMENTATION.md`
* [GH-53](https://github.com/apache/cordova-electron/pull/53) Add Node.js 12 to CI Services
* [GH-42](https://github.com/apache/cordova-electron/pull/42) Update the `config.xml` path in the XHR load eventListener
* [GH-45](https://github.com/apache/cordova-electron/pull/45) Append Installer Icon to User Build Settings for Custom Builds
* [GH-43](https://github.com/apache/cordova-electron/pull/43) Update `README`.md
* [GH-41](https://github.com/apache/cordova-electron/pull/41) Update System Requirements in `DOCUMENTATION.md`

### 1.0.2 (Mar 15, 2019)

* [GH-40](https://github.com/apache/cordova-electron/pull/40) Remove `temp` Dir After `create.spec.js` Test
* [GH-39](https://github.com/apache/cordova-electron/pull/39) Added Missing License Header in `util.js`
* [GH-38](https://github.com/apache/cordova-electron/pull/38) Support User Defined **Electron** Settings
* [GH-37](https://github.com/apache/cordova-electron/pull/37) Remove `nodeIntegration` Warning by Setting Default to `false`
* [GH-36](https://github.com/apache/cordova-electron/pull/36) Rename **Electron** Main Entry File
* [GH-35](https://github.com/apache/cordova-electron/pull/35) Refactor `build.js` and Include Test Coverage
* [GH-32](https://github.com/apache/cordova-electron/pull/32) Improve `temp` Folder Cleanup in `Api.spec.js`
* [GH-33](https://github.com/apache/cordova-electron/pull/33) Update `cordova run` to Work with Pre-Cordova 9.x CLI

### 1.0.1 (Mar 04, 2019)

Version bump with no change.

### 1.0.0 (Feb 25, 2019)

* [GH-30](https://github.com/apache/cordova-electron/pull/30) Asset Install Fix from Mobilespec Report
* [GH-29](https://github.com/apache/cordova-electron/pull/29) Correct File Header Licenses for Cordova JS Compile CMD
* [GH-28](https://github.com/apache/cordova-electron/pull/28) Fix Scope Issue with Code Refactor
* [GH-27](https://github.com/apache/cordova-electron/pull/27) Build Script Improvements
* [GH-24](https://github.com/apache/cordova-electron/pull/24) Remove Unused and Unreachable Code
* [GH-21](https://github.com/apache/cordova-electron/pull/21) Apply Missing Apache License Header
* [GH-25](https://github.com/apache/cordova-electron/pull/25) Updated `Api.spec.js` Async Tests to Return Promise
* [GH-22](https://github.com/apache/cordova-electron/pull/22) Add tests to `Api.spec.js`
* [GH-23](https://github.com/apache/cordova-electron/pull/23) Test `module.exports.prepare`
* [GH-19](https://github.com/apache/cordova-electron/pull/19) Adding New Test Specs
* [GH-20](https://github.com/apache/cordova-electron/pull/20) Fix Audit Report For High Severity Vulnerability
* [GH-18](https://github.com/apache/cordova-electron/pull/18) Refactor `prepare.js` and Increase Test Coverage
* [GH-17](https://github.com/apache/cordova-electron/pull/17) Unit Test Improvements & Refactor (Create, Api, Handler, Parser)
* [GH-16](https://github.com/apache/cordova-electron/pull/16) Prepare & Enable Travis CI Testing
* [GH-15](https://github.com/apache/cordova-electron/pull/15) Implement SettingsJson Class Tests and Update Documentation
* [GH-13](https://github.com/apache/cordova-electron/pull/13) Implement Electron Custom App Icons Functionality
* [GH-10](https://github.com/apache/cordova-electron/pull/10) Added NPM Ignore
* [GH-11](https://github.com/apache/cordova-electron/pull/11) Updated `README.md`
* [GH-9](https://github.com/apache/cordova-electron/pull/9) Electron Build Improvements
* [GH-8](https://github.com/apache/cordova-electron/pull/8) Create CDV Electron Settings JSON
* [GH-7](https://github.com/apache/cordova-electron/pull/7) Electron Platform Release Preparation (Cordova 9)
* [GH-6](https://github.com/apache/cordova-electron/pull/6) Cleanup Bin Files
* [GH-5](https://github.com/apache/cordova-electron/pull/5) Updated Correct Version Information
* [GH-4](https://github.com/apache/cordova-electron/pull/4) Electron Major Improvements & Feature Support
* [GH-1](https://github.com/apache/cordova-electron/pull/1) First Draft Release
* Add GitHub Pull Request Template
* Added NPM Install Step
* Added Run Command Support
