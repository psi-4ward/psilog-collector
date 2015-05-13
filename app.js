var api = require('./lib/api.js');
api.version = '0.0.0';

// register API object
require('./lib/utils.js');
require('./lib/argv.js');
require('./lib/logger.js');
require('./lib/configs.js');
require('./lib/loader.js');

var logpipes = require('./lib/logpipes');

api.on('ready', function() {
  if(api.argv.printconfig) {
    api.utils.printConfig();
    process.exit(0);
  }

  api.logger.debug('init logpipes');
  // create all logpipes
  logpipes.init();

  api.logger.info('PsiLog::collector started');
});
