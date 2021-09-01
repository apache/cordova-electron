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

### 3.0.0 (Sep 01, 2021)

#### Environment Updates

This release requires the environment to have **Node.js** `12.0.0` or higher. It is recommended to use the current LTS, which is `14.17.6` at the time of this release.

#### Project Dependencies

* `cordova-common@^4.0.2`
* `electron@14.0.0`
* `electron-builder@^22.11.7`
* `electron-devtools-installer@^3.2.0`
* `execa@^5.1.1`
* `fs-extra@^10.0.0`

#### Electron App Stack

* [Electron](https://www.electronjs.org/blog/electron-14-0) 14.0.0
* Chromium 93.0.4577.58
* Node v14.17.0
* V8 v9.3

#### Breaking Changes

* [GH-205](https://github.com/apache/cordova-electron/pull/205) feat!(Api): remove unused locations data
* [GH-203](https://github.com/apache/cordova-electron/pull/203) feat!(electron): bump to `14.0.0`
* [GH-202](https://github.com/apache/cordova-electron/pull/202) feat!: remove old VERSION file
* [GH-199](https://github.com/apache/cordova-electron/pull/199) feat!: update node support
* [GH-198](https://github.com/apache/cordova-electron/pull/198) feat!(dependencies): update other packages
  * `execa@5.1.1`
  * `fs-extra@10.0.0`
  * `jasmine@3.9.0`
* [GH-197](https://github.com/apache/cordova-electron/pull/197) feat!(dependencies): bump **Electron** packages
  * `electron-builder@22.11.7`
  * `electron-devtools-installer@3.2.0`
* [GH-175](https://github.com/apache/cordova-electron/pull/175) breaking: add plugin support

#### Features

* [GH-200](https://github.com/apache/cordova-electron/pull/200) feat: update supported platform options
* [GH-184](https://github.com/apache/cordova-electron/pull/184) feat: forward **Electron**'s process `stdio` to terminal

#### Fixes

* [GH-183](https://github.com/apache/cordova-electron/pull/183) fix(npm): change prepack script to prepare
* [GH-180](https://github.com/apache/cordova-electron/pull/180) fix(windows): **Electron** window not displaying
* [GH-182](https://github.com/apache/cordova-electron/pull/182) fix: restrict deep merging on reserved keys
* [GH-172](https://github.com/apache/cordova-electron/pull/172) fix(pkg): typo in field "`keywords`"
* [GH-169](https://github.com/apache/cordova-electron/pull/169) fix(Api): do not depend on globals

#### Refactor Changes

* [GH-181](https://github.com/apache/cordova-electron/pull/181) refactor: use class static

#### Chores

* [GH-201](https://github.com/apache/cordova-electron/pull/201) chore(asf-license): add to header
* [GH-171](https://github.com/apache/cordova-electron/pull/171) chore: clean up `package.json`

#### Test & Other Changes

* [GH-194](https://github.com/apache/cordova-electron/pull/194) build: build `cordova.js` on `prepare`
* [GH-204](https://github.com/apache/cordova-electron/pull/204) test: cleanup and remove unneeded code
* [GH-90](https://github.com/apache/cordova-electron/pull/90) test(create): fix, clean up & extend

### 2.0.0 (Sep 17, 2020)

#### Environment Updates

This release requires the environment to have **NodeJS** `10.0.0` or higher. It is recommended to use the current LTS, which is `12.18.4` at the time of this release.

#### Project Dependencies

* `cordova-common@^4.0.2`
* `electron@10.1.2`
* `electron-builder@^22.8.1`
* `electron-devtools-installer@^3.1.1`
* `execa@^4.0.3`
* `fs-extra@^9.0.1`

#### Electron App Stack

* Electron 10.1.2
* Chromium 85.0.4183.98
* Node v12.16.3
* V8 v8.5

#### Breaking Changes

* [GH-162](https://github.com/apache/cordova-electron/pull/162) breaking: use platform config parser
* [GH-152](https://github.com/apache/cordova-electron/pull/152) breaking: bump `electron` & `electron-builder`
* [GH-151](https://github.com/apache/cordova-electron/pull/151) breaking: bump `cordova-common@4.0.1`
* [GH-145](https://github.com/apache/cordova-electron/pull/145) breaking(`npm`): update dependencies
* [GH-142](https://github.com/apache/cordova-electron/pull/142) breaking: restructure the platform lib code
* [GH-138](https://github.com/apache/cordova-electron/pull/138) breaking: remove platform-centered workflow
* [GH-69](https://github.com/apache/cordova-electron/pull/69) breaking: drop `node` 6 and 8 support

#### Features

* [GH-160](https://github.com/apache/cordova-electron/pull/160) feat: install devtool extensions for debug builds
* [GH-154](https://github.com/apache/cordova-electron/pull/154) feature: support custom `scheme` & `hostname`
* [GH-148](https://github.com/apache/cordova-electron/pull/148) feat: support **Electron** arguments on run command
* [GH-112](https://github.com/apache/cordova-electron/pull/112) feat: move ci to gh-actions
* [GH-81](https://github.com/apache/cordova-electron/pull/81) feat: Support Loading Local HTML Files or Remote URL in the `BrowserWindow`

#### Refactor

* [GH-156](https://github.com/apache/cordova-electron/pull/156) refactor: remove more platform-centered files & update code
* [GH-153](https://github.com/apache/cordova-electron/pull/153) refactor: cleanup unused code
* [GH-129](https://github.com/apache/cordova-electron/pull/129) refactor (`create`): simplify project creation
* [GH-124](https://github.com/apache/cordova-electron/pull/124) refactor: transform `for`
* [GH-123](https://github.com/apache/cordova-electron/pull/123) refactor: transform `template` strings
* [GH-122](https://github.com/apache/cordova-electron/pull/122) refactor: transform `object` shorthand
* [GH-121](https://github.com/apache/cordova-electron/pull/121) refactor: transform `arrow` functions & `arrow` returns
* [GH-120](https://github.com/apache/cordova-electron/pull/120) refactor: transform `var` to `let`/`const`
* [GH-116](https://github.com/apache/cordova-electron/pull/116) refactor: remove `shelljs` and update tests
* [GH-118](https://github.com/apache/cordova-electron/pull/118) refator: replace `shelljs`/`spawn` with `execa`
* [GH-113](https://github.com/apache/cordova-electron/pull/113) refactor: `eslint` setup

#### Fix

* [GH-158](https://github.com/apache/cordova-electron/pull/158) fix(build): format `top-level` key for `nsis-web`
* [GH-136](https://github.com/apache/cordova-electron/pull/136) fix(npm-script): prepack

#### Chore, CI, & Test

* [GH-168](https://github.com/apache/cordova-electron/pull/168) chore: bump dependencies & related usage
* [GH-165](https://github.com/apache/cordova-electron/pull/165) chore: bump dependencies to latest
* [GH-164](https://github.com/apache/cordova-electron/pull/164) chore: bump **Electron** related dependencies
* [GH-147](https://github.com/apache/cordova-electron/pull/147) chore: various cleanup
* [GH-144](https://github.com/apache/cordova-electron/pull/144) chore(npm): bump `@cordova/eslint-config@^3.0.0` w/ lint fix
* [GH-125](https://github.com/apache/cordova-electron/pull/125) chore: configure app rel dependencies as abs paths
* [GH-117](https://github.com/apache/cordova-electron/pull/117) chore: update **Electron** dependencies
* [GH-128](https://github.com/apache/cordova-electron/pull/128) chore: update `package.json`
* [GH-114](https://github.com/apache/cordova-electron/pull/114) chore: update `jasmine` dependency
* [GH-110](https://github.com/apache/cordova-electron/pull/110) chore: bump version to 2.0.0-dev
* [GH-96](https://github.com/apache/cordova-electron/pull/96) chore: fix typo
* [GH-67](https://github.com/apache/cordova-electron/pull/67) chore: update development dependencies
* [GH-68](https://github.com/apache/cordova-electron/pull/68) chore: bump **Electron** dependencies
* chore(asf): update git notification settings
* Update CONTRIBUTING.md
* [GH-157](https://github.com/apache/cordova-electron/pull/157) ci: add node 14 to workflow
* [GH-146](https://github.com/apache/cordova-electron/pull/146) ci: update workflow
* [GH-141](https://github.com/apache/cordova-electron/pull/141) test (node-12.16.x): fix failures caused by shebang and rewire lint
* [GH-131](https://github.com/apache/cordova-electron/pull/131) test: refactor with minor fixes & improvements

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
