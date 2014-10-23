/**
 *  Input: file
 * tail a single file using the follow-by:name and retry options of `tail`
 * to continue tailing if the file gets removed and a new one with same name gets added
 * @param {string} file
 */

var spawn = require('child_process').spawn;
var fs = require('fs');
var api = require('../api.js');

api.inputs.file = function(config, cb) {
  if(!config.file) return cb('file parameter missing in ' + config.configFile);

  fs.exists(config.file, function(exists) {
    if(!exists) {
      api.logger.warn('['+config.name+']', 'File ' + config.file + ' does not exist but tailing starts whenever the file gets created.');
    }
  });

  api.logger.info('['+config.name+']', 'start tailing', config.file);

  var child = spawn('tail', ['-F', config.file, '-n', '0']);

  api.addShutdownFunc(function(cb) {
    child.kill();
    cb();
  });

  cb(null, child.stdout);
};

