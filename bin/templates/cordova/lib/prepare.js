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

const path = require('path');
const fs = require('fs-extra');
const { ConfigParser, xmlHelpers } = require('cordova-common');

module.exports.prepare = function (cordovaProject, options) {
    // First cleanup current config and merge project's one into own
    const defaultConfigPath = path.join(this.locations.platformRootDir, 'cordova', 'defaults.xml');
    const ownConfigPath = this.locations.configXml;
    const sourceCfg = cordovaProject.projectConfig;

    // If defaults.xml is present, overwrite platform config.xml with it.
    // Otherwise save whatever is there as defaults so it can be
    // restored or copy project config into platform if none exists.
    if (fs.existsSync(defaultConfigPath)) {
        this.events.emit('verbose', `Generating config.xml from defaults for platform "${this.platform}"`);
        fs.copySync(defaultConfigPath, ownConfigPath);
    } else if (fs.existsSync(ownConfigPath)) {
        this.events.emit('verbose', `Generating defaults.xml from own config.xml for platform "${this.platform}"`);
        fs.copySync(ownConfigPath, defaultConfigPath);
    } else {
        this.events.emit('verbose', `case 3 "${this.platform}"`);
        fs.copySync(sourceCfg.path, ownConfigPath);
    }

    // merge our configs
    this.config = new ConfigParser(ownConfigPath);
    xmlHelpers.mergeXml(sourceCfg.doc.getroot(), this.config.doc.getroot(), this.platform, true);
    this.config.write();

    // Update own www dir with project's www assets and plugins' assets and js-files
    this.parser.update_www(cordovaProject, options);

    // Copy or Create manifest.json
    const srcManifestPath = path.join(cordovaProject.locations.www, 'manifest.json');
    if (fs.existsSync(srcManifestPath)) {
        // just blindly copy it to our output/www
        // todo: validate it? ensure all properties we expect exist?
        const manifestPath = path.join(this.locations.www, 'manifest.json');
        this.events.emit('verbose', `Copying ${srcManifestPath} => ${manifestPath}`);
        fs.copySync(srcManifestPath, manifestPath);
    } else {
        this.events.emit('verbose', `Creating new manifest file in => ${this.path}`);

        (new ManifestJson(this.locations.www))
            .configure(this.config)
            .write();
    }

    (new PackageJson(this.locations.www))
        .configure(this.config)
        .write();

    // update project according to config.xml changes.
    return this.parser.update_project(this.config, options);
};

class PackageJson {
    constructor (wwwDir) {
        this.path = path.join(wwwDir, 'package.json');
        this.www = wwwDir;
        this.package = {
            main: 'main.js'
        };
    }

    configure (config) {
        if (config) {
            this.package.name = config.packageName() || 'io.cordova.hellocordova';
            this.package.displayName = config.name() || 'HelloCordova';
            this.package.version = config.version() || '1.0.0';
            this.package.description = config.description() || 'A sample Apache Cordova application that responds to the deviceready event.';

            this.configureHomepage(config);
            this.configureLicense(config);

            this.package.author = config.author() || 'Apache Cordova Team';
        }

        return this;
    }

    configureHomepage (config) {
        this.package.homepage = (config.doc.find('author') && config.doc.find('author').attrib['href']) || 'https://cordova.io';
    }

    configureLicense (config) {
        this.package.license = (config.doc.find('license') && config.doc.find('license').text && config.doc.find('license').text.trim()) || 'Apache-2.0';
    }

    write () {
        fs.writeFileSync(this.path, JSON.stringify(this.package, null, 2), 'utf8');
    }
}

class ManifestJson {
    constructor (wwwDir) {
        this.path = path.join(wwwDir, 'manifest.json');
        this.www = wwwDir;
        this.manifest = {
            background_color: '#FFF',
            display: 'standalone',
            orientation: 'any',
            start_url: 'index.html'
        };
    }

    configureIcons (config) {
        /**
        * given a tag like this :
        * <icon src="res/ios/icon.png" width="57" height="57" density="mdpi" />
        *
        * configParser returns icons that look like this :
        * {
        *      src: 'res/ios/icon.png',
        *      target: undefined,
        *      density: 'mdpi',
        *      platform: null,
        *      width: 57,
        *      height: 57
        * }
        *
        * manifest expects them to be like this :
        * {
        *      "src": "images/touch/icon-128x128.png",
        *      "type": "image/png",
        *      "sizes": "128x128"
        * }
        */
        const icons = config.getStaticResources(this.platform, 'icon')
            .map((icon) => ({
                src: icon.src,
                type: 'image/png',
                sizes: `${icon.width}x${icon.height}`
            }));

        if (icons) this.manifest.icons = icons;

        return this;
    }

    configureOrientation (config) {
        // orientation
        // <preference name="Orientation" value="landscape" />
        const oriPref = config.getGlobalPreference('Orientation');
        if (oriPref === 'landscape' || oriPref === 'portrait') {
            this.manifest.orientation = oriPref;
        }

        return this;
    }

    configureStartUrl (config) {
        // get start_url
        const contentNode = config.doc.find('content');
        if (contentNode) this.manifest.start_url = contentNode.attrib.src;

        return this;
    }

    configureThemeColor (config) {
        if (this.manifest.start_url) {
            const startUrlPath = path.join(this.www, this.manifest.start_url);

            if (fs.existsSync(startUrlPath)) {
                // fetch start url file content and parse for theme-color.
                const contents = fs.readFileSync(startUrlPath, 'utf-8');
                const result = /<meta(?=[^>]*name="theme-color")\s[^>]*content="([^>]*)"/i.exec(contents);

                // If theme-color exists, the value is in index 1.
                if (result && result.length >= 2) this.manifest.theme_color = result[1];
            }
        }

        if (this.manifest.start_url && !this.manifest.theme_color) {
            const themeColor = config.getGlobalPreference('StatusBarBackgroundColor');
            if (themeColor) this.manifest.theme_color = themeColor;
        }

        return this;
    }

    configure (config) {
        if (config) {
            if (config.name()) this.manifest.name = config.name();
            if (config.shortName()) this.manifest.short_name = config.shortName();
            if (config.packageName()) this.manifest.version = config.packageName();
            if (config.description()) this.manifest.description = config.description();
            if (config.author()) this.manifest.author = config.author();

            this.configureIcons(config)
                .configureOrientation(config)
                .configureStartUrl(config)
                .configureThemeColor(config);
        }

        return this;
    }

    write () {
        fs.writeFileSync(this.path, JSON.stringify(this.manifest, null, 2), 'utf8');
    }
}
