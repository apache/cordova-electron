<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->

# Cordova Electron

[Electron](https://electronjs.org) is a framework that uses web technologies (HTML, CSS, and JS) to build cross-platform desktop applications.

## Platform Objectives

- Build Desktop Applications (Linux, macOS, and Windows)
- Sign Applications for Release

## Usage

### Cordova CLI

```shell
$ npm install -g cordova@latest
$ cordova create helloworld
$ cd helloworld
$ cordova platform add electron
$ cordova run electron
```

<!-- 
@todo investigate standalone implementation. The current implementation uses paths that cordova-cli understands while standalone does not recognize them. As the standalone implementation does not work as expected in the current release and is not targeted for this release, please use cordova-cli.

## Standalone
1. Download the latest release from: [Apache Release Distribution](https://dist.apache.org/repos/dist/release/cordova/platforms/)
2. Extract `cordova-electron-#.#.#.tgz`.
3. Change the working directory to the extracted package.
4. Install package dependencies.

    `npm install`

5. Create new project with standalone binaraies.

```
$ ./bin/create helloworld
$ cd helloworld
$ ./cordova/run
```
-->

## Documentation

For more documentation, please refer to the [DOCUMENTATION.md](https://github.com/apache/cordova-electron/blob/master/DOCUMENTATION.md) file.

## Contributions

The Apache Cordova team would like to thank [Ibby Hadeed](https://www.npmjs.com/~ihadeed) for transferring the [`cordova-electron`](https://www.npmjs.com/package/cordova-electron) [npm](https://npmjs.com) package name to Apache Cordova. Thanks!
