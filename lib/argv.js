var api = require('./api.js');
var path = require('path');

api.argv = require("nomnom")
  .option('loglevel', {
    abbr: 'l',
    metavar: "LEVEL",
    default: 'warn',
    choices: ['error', 'warn', 'info', 'debug'],
    help: 'Set the Loglevel [error,warn,info,debug]'
  })
  .option('configdir', {
    abbr: 'c',
    metavar: "PATH",
    list: true,
    default: [__dirname + '/../conf.d'],
    help: 'Specify the directory holding the config files'
  })
  .option('printconfig', {
    flag: true,
    help: 'Print the current configuration and exit'
  })
  .option('logpipe', {
    metavar: "NAME",
    help: 'Load only a single logpipe file'
  })
  .option('version', {
    abbr: 'v',
    flag: true,
    help: 'print version',
    callback: function() {
      return "v"+api.version;
    }
  })
  .parse();

api.argv.configdir = api.argv.configdir.map(function(confdir) {
  return path.resolve(confdir);
});
