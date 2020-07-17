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

# Cordova Electron

Electron is a framework that uses web technologies (HTML, CSS, and JS) to build cross-platform desktop applications.

- [Cordova Electron](#cordova-electron)
  - [System Requirements](#system-requirements)
    - [Linux](#linux)
    - [Mac](#mac)
    - [Windows](#windows)
  - [Quick Start](#quick-start)
    - [Create a Project](#create-a-project)
    - [Preview a Project](#preview-a-project)
    - [Build a Project](#build-a-project)
  - [Customizing the Application's Icon](#customizing-the-applications-icon)
  - [Customizing the Application's Window Options](#customizing-the-applications-window-options)
    - [How to Set the Window's Default Size](#how-to-set-the-windows-default-size)
    - [How to Disable the Window From Being Resizable](#how-to-disable-the-window-from-being-resizable)
    - [How to Make the Window Fullscreen](#how-to-make-the-window-fullscreen)
    - [How to Support Node.js and Electron APIs](#how-to-support-nodejs-and-electron-apis)
    - [Customizing BrowserWindow Instance Method](#customizing-browserwindow-instance-method)
      - [Load a local HTML file using relative path from the `{project_dir}/www` directory](#load-a-local-html-file-using-relative-path-from-the-project_dirwww-directory)
      - [Load a local HTML using full path](#load-a-local-html-using-full-path)
      - [Load a remote URL](#load-a-remote-url)
  - [Customizing the Electron's Main Process](#customizing-the-electrons-main-process)
  - [Bundling Node Modules](#bundling-node-modules)
    - [Cordova Package Handling](#cordova-package-handling)
  - [DevTools](#devtools)
  - [Debugging the Application's Main Process](#debugging-the-applications-main-process)
  - [Enable Developer Tool Exrtensions (Chrome Extensions)](#enable-developer-tool-exrtensions-chrome-extensions)
  - [Build Configurations](#build-configurations)
    - [Default Build Configurations](#default-build-configurations)
    - [Customizing Build Configurations](#customizing-build-configurations)
      - [Adding a `package`](#adding-a-package)
      - [Setting the Package `arch`](#setting-the-package-arch)
    - [Multi-Platform Build Support](#multi-platform-build-support)
  - [Signing Configurations](#signing-configurations)
    - [macOS Signing](#macos-signing)
    - [Windows Signing](#windows-signing)
    - [Linux Signing](#linux-signing)
  - [Plugins](#plugins)

## System Requirements

### Linux

- **Python** version 2.7.x. It is recommended to check your Python version since some distributions like CentOS 6.x still use Python 2.6.x.

### Mac

- **Python** version 2.7.x with support for TLS 1.2.
- **Xcode**, the IDE for macOS, comes bundled with necessary software development tools to code signing and compiling native code for macOS. Version 8.2.1 or higher.
- **RedHat Build Support**
  - **Homebrew**, one of the available macOS package managers, is used for installing additional tools and dependencies. Homebrew is needed to install RPM packaging dependencies. [**Brew Install Step**](https://brew.sh/)
  - **RPM**, a standard package manager for multiple Linux distributions, is the tool used for creating the Linux RPM package. To install this tool, use the following [**Homebrew**](https://brew.sh/) command:

    ```bash
    brew install rpm
    ```

### Windows

- **Python** version 2.7.10 or higher.
- **PowerShell**, for Windows 7 users, must be at version 3.0 or greater for [app signing](https://www.electron.build/code-signing#windows).
- **[Debugging Tools for Windows](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/)** is a toolkit for enhancing debug capabilities. It is recommended to install with the **Windows SDK 10.0.15063.468**.

## Quick Start

### Create a Project

```bash
npm i -g cordova
cordova create sampleApp
cd sampleApp
cordova platform add electron
```

_Notice: If using Cordova CLI prior to version 9.x, you will need to use the `cordova-electron` argument instead of `electron` for any command that requires the platform's name. For example:_

```bash
cordova platform add cordova-electron
cordova run cordova-electron
```

### Preview a Project

It is not necessary to build the Electron application for previewing. Since the building process can be slow, it is recommended to pass in the `--nobuild` flag to disable the build process when previewing.

```bash
cordova run electron --nobuild
```

### Build a Project

**Debug Builds**

```bash
cordova build electron
cordova build electron --debug
```

**Release Builds**

```bash
cordova build electron --release
```

## Customizing the Application's Icon

Customized icon(s) can be declared with the `<icon>` element(s) in the `config.xml` file. There are two types of icons that can be defined, the application icon and the package installer icon. These icons should be defined in the Electron's platform node `<platform name="electron">`.

One icon can be used for the application and installer, but this icon should be at least **512x512** pixels to work across all operating systems.

_Notice: If a customized icon is not provided, the Apache Cordova default icons are used._

_Notice: macOS does not display custom icons when using `cordova run`. It defaults to the Electron's icon._

```xml
<platform name="electron">
    <icon src="res/electron/icon.png" />
</platform>
```

You can supply unique icons for the application and installer by setting the `target` attribute. As mentioned above, the installer image should be **512x512** pixels to work across all platforms.

```xml
<platform name="electron">
    <icon src="res/electron/app.png" target="app" />
    <icon src="res/electron/installer.png" target="installer" />
</platform>
```

For devices that support high-DPI resolutions, such as Apple's Retina display, you can create a set of images with the same base filename but suffix with its multiplier.

For example, if the base image's filename `icon.png` and is the standard resolution, then `icon@2x.png` will be treated as a high-resolution image that with a DPI doubled from the base.

- icon.png (256px x 256px)
- icon@2x.png (512px x 512px)

If you want to support displays with different DPI densities at the same time, you can put images with different sizes in the same folder and use the filename without DPI suffixes. For example:

```xml
<platform name="electron">
    <icon src="res/electron/icon.png" />
    <icon src="res/electron/icon@1.5x.png" />
    <icon src="res/electron/icon@2x.png" />
    <icon src="res/electron/icon@4x.png" target="installer" />
</platform>
```

## Customizing the Application's Window Options

Electron provides many options to manipulate the [`BrowserWindow`](https://electronjs.org/docs/api/browser-window). This section will cover how to configure a few basic options. For a full list of options, please see the [Electron's Docs - BrowserWindow Options](https://electronjs.org/docs/api/browser-window#new-browserwindowoptions).

Working with a Cordova project, it is recommended to create an Electron settings file within the project's root directory, and set its the relative path in the preference option `ElectronSettingsFilePath`, in the `config.xml` file.

**Example `config.xml`:**

```xml
<platform name="electron">
    <preference name="ElectronSettingsFilePath" value="res/electron/settings.json" />
</platform>
```

To override or set any BrowserWindow options or supply arguments to the loadURL method (BrowserWindow instance method), in this file the options are added to the `browserWindow` or `browserWindowInstance` property accordingly.

**Example `res/electron/settings.json`:**

```json
{
    "browserWindow": { ... },
    "browserWindowInstance": { ... }
}
```

### How to Set the Window's Default Size

By default, the `width` is set to **800** and the `height` set to **600**. This can be overridden by setting the `width` and `height` property.

**Example:**

```json
{
    "browserWindow": {
        "width": 1024,
        "height": 768
    }
}
```

### How to Disable the Window From Being Resizable

Setting the `resizable` flag property, you can disable the user's ability to resize your application's window.

**Example:**

```json
{
    "browserWindow": {
        "resizable": false
    }
}
```

### How to Make the Window Fullscreen

Using the `fullscreen` flag property, you can force the application to launch in fullscreen.

**Example:**

```json
{
    "browserWindow": {
        "fullscreen": true
    }
}
```

### How to Support Node.js and Electron APIs

Set the `nodeIntegration` flag property to `true`.  By default, this property flag is set to `false` to support popular libraries that insert symbols with the same names that Node.js and Electron already uses.

> You can read more about this at Electron docs: [I can not use jQuery/RequireJS/Meteor/AngularJS in Electron](https://electronjs.org/docs/faq#i-can-not-use-jqueryrequirejsmeteorangularjs-in-electron).

 **Example:**

```json
{
    "browserWindow": {
        "webPreferences": {
            "nodeIntegration": false
        }
    }
}
```

### Customizing BrowserWindow Instance Method

Objects created with `new BrowserWindow` have instance methods, one of such is `loadURL`.

By default, `loadURL` loads a local HTML file which should be defined in `config.xml` under `content` tag.
The `content` tag value can be a remote address (e.g. `http://`) or a path to a local HTML file using the `file://` protocol.

For Cordova Electron only: It is possible to override this option from the Electron settings file which additionally provides more options.

> Learn more about [loadURL - BrowserWindow Instance Method](https://electronjs.org/docs/api/browser-window#winloadurlurl-options).

#### Load a local HTML file using relative path from the `{project_dir}/www` directory

To override the local HTML file, place your HTML file anywhere in the `{project_dir}/www` directory and define the path in the Electron settings file.

 **Example**
```json
  "browserWindowInstance": {
    "loadURL": {
      "url": "custom.html"
    }
  }
```

#### Load a local HTML using full path

To override the local HTML file using a full path, define the location of the local HTML file in the Electron settings file.

 **Example**
```json
  "browserWindowInstance": {
    "loadURL": {
      "url": "file://{full_path}/index.html"
    }
  }
```



#### Load a remote URL

To load a remote address, define the `url` in the Electron settings file.

 **Example**
```json
  "browserWindowInstance": {
    "loadURL": {
      "url": "https://cordova.apache.org"
    }
  }
```

It is also possible to supply additional parameters using the [optional] `options` argument.

 **Example**
```json
  "browserWindowInstance": {
    "loadURL": {
      "url": "https://cordova.apache.org",
      "options": {
        "extraHeaders": "Content-Type: text/html"
      }
    }
  }
```

> For more information refer to [Electron documentation](https://electronjs.org/docs/api/browser-window#winloadurlurl-options).

## Customizing the Electron's Main Process

If it is necessary to customize the Electron's main process beyond the scope of the Electron's configuration settings, changes can be added directly to the `cdv-electron-main.js` file located in `{PROJECT_ROOT_DIR}/platform/electron/platform_www/`. This is the application's main process.

> &#10071; However, it is not recommended to modify this file as the upgrade process for `cordova-electron` is to remove the old platform before adding the new version.

## Bundling Node Modules

Supporting node modules with your application is possible by bundling them with your app. Installing modules, with npm, as a dependency of the Cordova project will automatically bundle them with your app.

Below, is example instructions on how to bundle and enable the use of `lodash`.

1. Create a project using the steps from "[Create a Project](#create-a-project)".
2. Install `lodash`

   ```bash
   npm i -S loash
   ```

3. Enable Node.js support by following the "[How to Support Node.js and Electron APIs](#how-to-support-nodejs-and-electron-apis)"
4. Import `lodash` in your application using `require`

    ```javascript
    const _ = require('lodash');
    ```

### Cordova Package Handling

By default, all Cordova packages are currently installed as `dependencies` of the project.

It is recommended that all Cordova packages are defined as `devDependencies` in the `package.json` file. It is safe to move them manually.
Packages defined as a dependency will be bundled with the application and can increase the built application's size.

## DevTools

The `--release` and `--debug` flags control the visibility of the DevTools. DevTools are shown by default on **Debug Builds** (`without a flag` or with `--debug`). If you want to hide the DevTools pass in the `--release` flag when building or running the application.

> Note: DevTools can be closed or opened manually with the debug build.

## Debugging the Application's Main Process

If you need to debug the application's main process, you can do so by enabling the inspector with the Election's `inspect` or `inspect-brk` flags.

As these flags are provided by Electron, you will need to separate the Cordova flags from Electron flags with an additional `--` separator.

For example:

```shell
cordova run electron --nobuild --debug -- --inspect-brk=5858
```

## Enable Developer Tool Exrtensions (Chrome Extensions)

To enable a devtool extension, for a debug build, add the `devToolsExtension` collection to the Cordova Electron Settings file (`ElectronSettingsFilePath`).

For example:

```json
{
  "devToolsExtension": [
    "VUEJS_DEVTOOLS"
  ]
}
```

Below is a list of pre-provided devtools that can be added.

- `EMBER_INSPECTOR`
- `REACT_DEVELOPER_TOOLS`
- `BACKBONE_DEBUGGER`
- `JQUERY_DEBUGGER`
- `ANGULARJS_BATARANG`
- `VUEJS_DEVTOOLS`
- `REDUX_DEVTOOLS`
- `REACT_PERF`
- `CYCLEJS_DEVTOOL`
- `APOLLO_DEVELOPER_TOOLS`
- `MOBX_DEVTOOLS`

If there are any devtools or extensions you wish to use that are avaiable in the Chrome App Store, you can add them by provided the extension's app ID.

**Note:** The developer tools & extensions are not installed on a release build.

**Example:**

```json
{
    "browserWindow": {
        "width": 1024,
        "height": 768
    }
}
```

## Build Configurations

### Default Build Configurations

By default, with no additional configuration, `cordova build electron` will build default packages for the host operating system (OS) that triggers the command. Below, are the list of default packages for each OS.

**Linux**

| Package | Arch  |
| ------- | :---: |
| tar.gz  |  x64  |

**Mac**

| Package | Arch  |
| ------- | :---: |
| dmg     |  x64  |
| zip     |  x64  |

**Windows**

| Package | Arch  |
| ------- | :---: |
| nsis    |  x64  |

### Customizing Build Configurations

If for any reason you would like to customize the build configurations, modifications are placed within the `build.json` file located in the project's root directory. E.g. `{PROJECT_ROOT_DIR}/build.json`. This file contains all build configurations for all platforms (Android, Electron, iOS, Windows).

**Example Config Structure**

```json
{
    "electron": {}
}
```

Since the Electron framework is for creating cross-platform applications, multiple configurations are required for each OS build. The `electron` node, in the `build.json` file, contains three properties that separate the build configurations for each OS.

**Example Config Structure with Each Platform**

```json
{
    "electron": {
        "linux": {},
        "mac": {},
        "windows": {}
    }
}
```

Each OS node contains properties that are used to identify what package to generate and how to sign.

**OS Properties:**

- `package` is an array of package formats that will be generated.
- `arch` is an array of architectures that each package is built for.
- `signing` is an object that contains signing information. See [Signing Configurations](#signing-configurations) for more information.

Any properties that are undefined will fallback to default values.

#### Adding a `package`

The `package` property is an array list of packages to be outputted. If the property is defined, the default packages are not used unless added. The order of the packages has no importance.

The configuration example below will generate `tar.gz`, `dmg` and `zip` packages for macOS.

```json
{
    "electron": {
        "mac": {
            "package": [
                "dmg",
                "tar.gz",
                "zip"
            ]
        }
    }
}
```

**Available Packages by Operating System**

| Package Type |  Linux  |      macOS       |          Windows           |
| ------------ | :-----: | :--------------: | :------------------------: |
| default      |    -    | `dmg`<br />`zip` |             -              |
| dmg          |    -    |     &#9989;      |             -              |
| mas          |    -    |     &#9989;      |             -              |
| mas-dev      | &#9989; |        -         |             -              |
| pkg          |    -    |     &#9989;      |             -              |
| 7z           | &#9989; |     &#9989;      |          &#9989;           |
| zip          | &#9989; |     &#9989;      |          &#9989;           |
| tar.xz       | &#9989; |     &#9989;      |          &#9989;           |
| tar.lz       | &#9989; |     &#9989;      |          &#9989;           |
| tar.gz       | &#9989; |     &#9989;      |          &#9989;           |
| tar.bz2      | &#9989; |     &#9989;      |          &#9989;           |
| dir          | &#9989; |     &#9989;      |          &#9989;           |
| nsis         |    -    |        -         |          &#9989;           |
| nsis-web     |    -    |        -         |          &#9989;           |
| portable     |    -    |        -         |          &#9989;           |
| appx         |    -    |        -         | &#9989; <sup>**[1]**</sup> |
| msi          |    -    |        -         |          &#9989;           |
| AppImage     | &#9989; |        -         |             -              |
| snap         | &#9989; |        -         |             -              |
| deb          | &#9989; |        -         |             -              |
| rpm          | &#9989; |        -         |             -              |
| freebsd      | &#9989; |        -         |             -              |
| pacman       | &#9989; |        -         |             -              |
| p5p          | &#9989; |        -         |             -              |
| apk          | &#9989; |        -         |             -              |

- **[1]** Only Window 10 can build AppX packages.

#### Setting the Package `arch`

The `arch` property is an array list of architectures that each package is built for. When the property is defined, the default arch is not used unless added.

> &#10071;  Not all architectures are available for every operating system. Please review the [Electron Releases](https://github.com/electron/electron/releases/) to identify valid combinations. For example, macOS (Darwin) only supports x64.

**Available Arch**

- ia32
- x64
- armv71
- arm64

The example above will generate an `x64` `dmg` package.

```json
{
    "electron": {
        "mac": {
            "package": [ "dmg" ],
            "arch": [ "x64" ]
        }
    }
}
```

### Multi-Platform Build Support

> &#10071; Not all platforms support this feature and may have limitations.

Building for multiple platforms on a single operating system may possible but has limitations. It is recommended that the builder's operating system (host OS) matches with the platform that is being built.

The matrix below shows each host OS and for which platforms they are capable of building applications.

| Host <sup>**[1]**</sup> |  Linux  |   Mac   |           Window            |
| ----------------------- | :-----: | :-----: | :-------------------------: |
| Linux                   | &#9989; |         | &#10071; <sup>**[2]**</sup> |
| Mac <sup>**[3]**</sup>  | &#9989; | &#9989; | &#10071; <sup>**[2]**</sup> |
| Window                  |         |         |           &#9989;           |

**Limitations:**

- **[1]** If the app contains native dependency, it can only be compiled on the targeted platform.
- **[2]** Linux and macOS are unable to build Windows Appx packages for Windows Store.
- **[3]** [All required system dependencies, except rpm, will be downloaded automatically on demand. RPM can be installed with brew. (macOS Sierra 10.12+)](https://www.electron.build/multi-platform-build#macos)

The example below enables multi-platform build for all OS and uses the default build configurations.

```json
{
    "electron": {
        "linux": {},
        "mac": {},
        "windows": {}
    }
}
```

## Signing Configurations

### macOS Signing

There are three types of signing targets. (`debug`, `release`, and `store`). Each section has the following properties:

| key                                                                                                                                                 | description                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| entitlements                                                                                                                                        | String path value to entitlements file.                                                                                          |
| entitlementsInherit                                                                                                                                 | String path value to the entitlements file which inherits the security settings.                                                 |
| identity                                                                                                                                            | String value of the name of the certificate.                                                                                     |
| [requirements](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/RequirementLang/RequirementLang.html) | String path value of requirements file. <br /><br />&#10071; This is not available for the `mas` (store) signing configurations. |
| provisioningProfile                                                                                                                                 | String path value of the provisioning profile.                                                                                   |

**Example Config:**

```json
{
    "electron": {
        "mac": {
            "package": [
                "dmg",
                "mas",
                "mas-dev"
            ],
            "signing": {
                "release": {
                    "identity": "APACHE CORDOVA (TEAMID)",
                    "provisioningProfile": "release.mobileprovision"
                }
            }
        }
    }
}
```

For macOS signing, there are a few exceptions to how the signing information is used.
By default, all packages with the exception of `mas` and `mas-dev`, use the `debug` and `release` signing configurations.

Using the example config above, let's go over some use cases to better understand the exceptions.

**Use Case 1:**

```bash
cordova build electron --debug
```

The command above will:

- Generate a `dmg` build and `mas-dev` build using the `debug` signing configurations.
- Ignore the `mas` target package.

*Use Case 2:*

```bash
cordova build electron --release
```

The command above will:

- Generate a `dmg` build using the `release` config.
- Generate a `mas` build using the `store` config.
- Ignore the `mas-dev` target package.

### Windows Signing

The signing information is comprised of two types. (`debug`, `release`). Each section has the following properties:

| key                       | description                                                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| certificateFile           | String path to the certificate file.                                                                                                                 |
| certificatePassword       | String value of the certificate file's password.<br /><br />**Alternative**: The password can be set on the environment variable `CSC_KEY_PASSWORD`. |
| certificateSubjectName    | String value of the signing certificate's subject.<br /><br />&#10071; Required for EV Code Signing and requires Windows                             |
| certificateSha1           | String value of the SHA1 hash of the signing certificate.<br /><br />&#10071; Requires Windows                                                       |
| signingHashAlgorithms     | Collection of singing algorithms to be used. (`sha1`, `sha256`)<br /><br />&#10071; AppX builds only support `sha256`                                |
| additionalCertificateFile | String path to the additional certificate files.                                                                                                     |

**Example Config:**

```json
{
    "electron": {
        "windows": {
            "package": [ "nsis" ],
            "signing": {
                "release": {
                    "certificateFile": "path_to_files",
                    "certificatePassword": "password"
                }
            }
        }
    }
}
```

### Linux Signing

There are not signing requirements for Linux builds.

## Plugins

All browser-based plugins are usable with the Electron platform.

When adding a plugin, if the plugin supports both the `electron` and `browser` platform, the `electron` portion will be used. If the plugin misses `electron` but contains the `browser` implementation, it will fall back on the `browser` implementation.

Internally, Electron is using Chromium (Chrome) as its web view. Some plugins may have conditions written specifically for each different browser. In this case, it may affect the behavior of what is intended. Since Electron may support feature that the browser does not, these plugins would possibly need to be updated for the `electron` platform.
