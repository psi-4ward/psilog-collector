var spawn = require('child_process').spawn;
var fs = require('fs');
var api = require('../api.js');

api.inputs.catfile = function(config, cb) {
  if(!config.file) cb('catefile parameter missing in ' + config.configFile);

  fs.exists(config.file, function(exists) {
    if(!exists) {
      api.logger.warn('['+config.name+']', 'File ' + config.file + ' does not exist.');
      cb('File not found');
    } else {
      api.logger.info('['+config.name+']', 'catting', config.file);
      cb(null, spawn('cat', [config.file]).stdout);
    }
  });

};

