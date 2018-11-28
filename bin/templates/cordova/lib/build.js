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

const fs = require('fs-extra');
const path = require('path');

function deepMerge (mergeTo, mergeWith) {
    for (const property in mergeWith) {
        if (Object.prototype.toString.call(mergeWith[property]) === '[object Object]') {
            mergeTo[property] = deepMerge((mergeTo[property] || {}), mergeWith[property]);
        } else if (Object.prototype.toString.call(mergeWith[property]) === '[object Array]') {
            mergeTo[property] = [].concat((mergeTo[property] || []), mergeWith[property]);
        } else {
            mergeTo[property] = mergeWith[property];
        }
    }

    return mergeTo;
}

const PLATFORM_MAPPING = {
    linux: 'linux',
    mac: 'darwin',
    windows: 'win32'
};

class ElectronBuilder {
    constructor (buildOptions, api) {
        this.api = api;
        this.isDevelopment = buildOptions.debug;
        this.buildConfig = buildOptions && buildOptions.buildConfig && fs.existsSync(buildOptions.buildConfig) ? require(buildOptions.buildConfig) : false;
    }

    configure () {
        this.buildSettings = this.configureUserBuildSettings()
            .configureBuildSettings();

        // Replace the templated placeholders with the project defined settings into the buildSettings.
        this.injectProjectConfigToBuildSettings();

        return this;
    }

    configureUserBuildSettings (buildOptions) {
        if (this.buildConfig && this.buildConfig.electron) {
            let userBuildSettings = {};

            for (const platform in this.buildConfig.electron) {
                if (platform !== 'mac' && platform !== 'linux' && platform !== 'windows') continue;

                const platformConfigs = this.buildConfig.electron[platform];

                /**
                 * In this scenario, the user has added a valid platform to build for but has not provided any custom build configurations.
                 * This will fetch thew platform's default build configuration.
                 * Each platform's default build configurations are located in the "./build/" directory.
                 */
                if (Object.keys(platformConfigs).length === 0) {
                    userBuildSettings = deepMerge(userBuildSettings, this.fetchPlatformDefaults(PLATFORM_MAPPING[platform]));
                    continue;
                }

                /**
                 * Validate that the platform configuration properties provided are valid.
                 * Any invalid property will be warned and iggnored.
                 * If there is there are no valid properties
                 */
                if (!this.__validateUserPlatformBuildSettings(platformConfigs)) {
                    throw `The platform "${platform}" contains an invalid property. Valid properties are: package, arch, signing`;
                }

                this.__formatAppendUserSettings(platform, platformConfigs, userBuildSettings);
            }

            this.userBuildSettings = userBuildSettings;
        }

        return this;
    }

    __formatAppendUserSettings (platform, platformConfigs, userBuildSettings) {
        // Add the platform at the root level to trigger build.
        userBuildSettings[platform] = [];

        // Add the config placeholder for build configurations (only add once if missing)
        if (!userBuildSettings.config) userBuildSettings.config = {};

        userBuildSettings.config[platform] = {
            target: []
        };

        // Only macOS and Windows can identifiy the build type. (development or distribution)
        if (platform !== 'linux') {
            // eslint-disable-next-line no-template-curly-in-string
            userBuildSettings.config[platform].type = '${BUILD_TYPE}';
        }

        if (platformConfigs.package) {
            platformConfigs.package.forEach((target) => {
                if (target === 'mas') {
                    userBuildSettings.config['mas'] = {};
                }
                /**
                 * The target of arch values are not validated as electron-builder will handle this.
                 * If the arch value is missing, 64-bit will be defaulted.
                 */
                userBuildSettings.config[platform].target.push({
                    target,
                    arch: platformConfigs.arch || ['x64']
                });
            });
        } else {
            /**
             * We will fetch and use the defaults when a package type is not identified.
             * If the arch value is identified, we will update each default package with the correct arch.
             */
            const platformDefaults = this.fetchPlatformDefaults(PLATFORM_MAPPING[platform]);

            let platformTargetPackages = platformDefaults.config[platform].target;

            if (platformConfigs.arch) {
                platformTargetPackages.forEach((pkg, i) => {
                    platformTargetPackages[i].arch = platformConfigs.arch;
                });
            }

            userBuildSettings.config[platform].target = platformTargetPackages;
        }

        if (platformConfigs.signing) {
            this.__appendUserSingning(platform, platformConfigs.signing, userBuildSettings);
        }
    }

    __appendUserSingning (platform, signingConfigs, userBuildSettings) {
        if (platform === 'linux') {
            // emit that there is no signing.
            return this;
        }

        const config = this.isDevelopment ? signingConfigs.debug : signingConfigs.release;
        if (platform === 'mac' && config) {
            this.__appendMacUserSingning(config, userBuildSettings.config.mac);
        }

        const masConfig = this.isDevelopment ? null : (signingConfigs.store || null);
        if (platform === 'mac' && masConfig) {
            // Requirements is not available for mas.
            if (masConfig.requirements) delete masConfig.requirements;
            this.__appendMacUserSingning(masConfig, userBuildSettings.config.mas);
        }

        if (platform === 'windows' && config) {
            this.__appendWindowsUserSingning(config, userBuildSettings.config.windows);
        }
    }

    __validateUserPlatformBuildSettings (platformConfigs) {
        return !!(
            platformConfigs.package
            || platformConfigs.arch
            || platformConfigs.signing
        );
    }

    __appendMacUserSingning (config, buildConfigs) {
        if (config.identity || process.env.CSC_LINK || process.env.CSC_NAME) buildConfigs.identity = config.identity || process.env.CSC_LINK || process.env.CSC_NAME;

        const entitlements = config.entitlements;
        if (entitlements && fs.existsSync(entitlements)) {
            buildConfigs.entitlements = entitlements;
        } else if (entitlements) {
            // emit that the entitlement path is missing.
        }

        const entitlementsInherit = config.entitlementsInherit;
        if (entitlementsInherit && fs.existsSync(entitlementsInherit)) {
            buildConfigs.entitlementsInherit = entitlementsInherit;
        } else if (entitlementsInherit) {
            // emit that the entitlement path is missing.
        }

        const requirements = config.requirements;
        if (requirements && fs.existsSync(requirements)) {
            buildConfigs.requirements = requirements;
        } else if (requirements) {
            // emit that the entitlement path is missing.
        }

        const provisioningProfile = config.provisioningProfile;
        if (provisioningProfile && fs.existsSync(provisioningProfile)) {
            buildConfigs.provisioningProfile = provisioningProfile;
        } else if (provisioningProfile) {
            // emit that the provisioningProfile path is missing.
        }
    }

    __appendWindowsUserSingning (config, buildConfigs) {
        const certificateFile = config.certificateFile;
        if (certificateFile && fs.existsSync(certificateFile)) {
            buildConfigs.certificateFile = certificateFile;

            if (config.certificatePassword || process.env.CSC_KEY_PASSWORD) buildConfigs.certificatePassword = config.certificatePassword || process.env.CSC_KEY_PASSWORD;
        } else if (certificateFile) {
            // emit that the certificateFile path is missing.
        }

        if (config.certificateSubjectName) buildConfigs.certificateSubjectName = config.certificateSubjectName;
        if (config.certificateSha1) buildConfigs.certificateSha1 = config.certificateSha1;
        if (config.signingHashAlgorithms) buildConfigs.signingHashAlgorithms = config.signingHashAlgorithms;

        const additionalCertificateFile = config.additionalCertificateFile;
        if (additionalCertificateFile && fs.existsSync(additionalCertificateFile)) {
            buildConfigs.additionalCertificateFile = additionalCertificateFile;
        } else if (additionalCertificateFile) {
            // emit that the additionalCertificateFile path is missing.
        }
    }

    configureBuildSettings () {
        const baseConfig = require(path.resolve(__dirname, './build/base.json'));
        const platformConfig = this.userBuildSettings || this.fetchPlatformDefaults(process.platform);

        return deepMerge(baseConfig, platformConfig);
    }

    injectProjectConfigToBuildSettings () {
        // const isDevelopment = false;
        const packageJson = require(path.join(this.api.locations.www, 'package.json'));
        const userConfig = {
            APP_ID: packageJson.name,
            APP_TITLE: packageJson.displayName,
            APP_WWW_DIR: this.api.locations.www,
            APP_BUILD_DIR: this.api.locations.build,
            BUILD_TYPE: this.isDevelopment ? 'development' : 'distribution'
        };

        // convert to string for string replacement
        let buildSettingsString = JSON.stringify(this.buildSettings);

        Object.keys(userConfig).forEach((key) => {
            const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
            const value = userConfig[key].replace(/\\/g, `\\\\`);
            buildSettingsString = buildSettingsString.replace(regex, value);
        });

        // update build settings with formated data
        this.buildSettings = JSON.parse(buildSettingsString);

        return this;
    }

    fetchPlatformDefaults (platform) {
        const platformFile = path.resolve(__dirname, `./build/${platform}.json`);

        if (!fs.existsSync(platformFile)) {
            throw `Your platform "${platform}" is not supported as a default target platform for Electron.`;
        }

        return require(platformFile);
    }

    build () {
        return require('electron-builder').build(this.buildSettings);
    }
}

module.exports.run = (buildOptions, api) => require('./check_reqs')
    .run()
    .then(() => (new ElectronBuilder(buildOptions, api))
        .configure()
        .build()
    )
    .catch((error) => {
        console.log(error);
    });

module.exports.help = () => {
    console.log('Usage: cordova build electron');
    console.log('Packages your app for distribution, or running locally.');
};
