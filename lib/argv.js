var api = require('./api.js');
var path = require('path');

api.argv = require("nomnom")
  .option('loglevel', {
    abbr: 'l',
    default: 'warn',
    choices: ['error', 'warn', 'info', 'debug'],
    help: 'Set the Loglevel [error,warn,info,debug]'
  })
  .option('configdir', {
    abbr: 'c',
    default: 'conf.d',
    help: 'Specify the directory holding the config files'
  })
  .option('printconfig', {
    flag: true,
    help: 'Print the current configuration and exit'
  })
  .option('logpipe', {
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

api.argv.configdir = path.resolve(api.argv.configdir);