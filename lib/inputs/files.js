/** Input: files
 * Tail all matching files within a directory
 * * start tailing when new files are added
 * * stop tailing when files are deleted
 * * rename a file acts like delete+add
 *
 * @param {string} dir Directory to watch
 * @param {string} glob A globbing pattern to filter the files (ie *.log)
 */

var spawn = require('child_process').spawn;
var api = require('../api.js');
var sane = require('sane');
var fs = require('fs');
var _ = require('lodash');

api.inputs.files = function(config, cb) {
  if(!config.dir) return cb('dir parameter missing in ' + config.configFile);
  if(!config.glob) return cb('glob parameter missing in ' + config.configFile);

  var tails = {};
  function createStream(file) {
    if(tails[file]) return;

    api.logger.info('[' + config.name + ']', 'start tailing', config.dir + '/' + file);
    tails[file] = spawn('tail', ['-f', config.dir + '/' + file, '-n', '0']);
    cb(null, tails[file].stdout);
  }

  api.addShutdownFunc(function(cb) {
    _.forEach(tails, function(tail) {
      tail.kill();
    });
    cb();
  });

  var watcher = sane(config.dir, config.glob);

  // init tails on start
  fs.readdir(config.dir, function(err, files) {
    if(err) return cb(err);
    files.filter(watcher.isFileIncluded.bind(watcher)).forEach(createStream);
  });

  // watch for new files
  watcher.on('add', function(file, root, stat) {
    createStream(file);
  });

  // watch for deleted files
  watcher.on('delete', function(file, root) {
    api.logger.info('[' + config.name + ']', 'stop tailing', config.dir + '/' + file);
    tails[file].kill();
  });

  // note: a file rename emits delete oldName and add newName
};

