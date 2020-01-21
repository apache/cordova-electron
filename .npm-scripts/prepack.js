const { resolve } = require('path');
const { copyFileSync } = require('fs-extra');

// copy cordova.js to bin/templates/project
copyFileSync(resolve('cordova-lib/cordova.js'), resolve('bin/templates/platform_www/cordova.js'));
