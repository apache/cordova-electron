var spawn = require('child_process').spawn,
    shell = require('shelljs'),
    path = require('path'),
    electron = require('electron-prebuilt');

exports.help = function(args) {
    console.log('Implement Help');
    process.exit(0);
}

exports.run = function(args) {
    console.log('run');
    console.log(electron);
    console.log(__dirname)
    spawn(electron, [path.join(__dirname, '/main.js')])
}
