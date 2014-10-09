var api = require('./api');
var yaml = require('js-yaml');
var glob = require("glob");
var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('lodash');

function yamlParseError(file, e) {
  return 'Could not parse ' + file + ": " + e.message.substr(9);
}

function loadConfig(cb) {
  fs.readFile(api.argv.configdir + '/main.yml', {encoding: 'utf8'}, function(err, data) {
    api.logger.debug('Loading config: ' + api.argv.configdir + '/main.yml');
    if(err) return cb(err);
    try {
      api.config = yaml.safeLoad(data);
      cb();
    } catch(e) {
      cb(yamlParseError(api.argv.configdir + '/main.yml', e));
    }
  })
}

function loadPresets(cb) {
  api.presets = {};
  var files = glob.sync(api.argv.configdir + "/presets/**/*.yml");
  if(!files) cb(null);
  async.each(files, function(file, cb) {
    api.logger.debug('Loading preset: ' + file);
    fs.readFile(file, {encoding: 'utf8'}, function(err, data) {
      if(err) return cb(err);
      try {
        var doc = yaml.safeLoad(data);
        var preset = path.basename(file, '.yml');
        api.presets[preset] = doc;
        cb();
      } catch(e) {
        cb(yamlParseError(file, e));
      }
    });
  }, cb);
}

function loadLogpipes(cb) {
  api.logpipes = [];

  var files;
  if(api.argv.logpipe) {
    files = [api.argv.logpipe];
  } else {
    files = glob.sync(api.argv.configdir + "/logpipes/**/*.yml");
  }

  if(!files) cb('No Logpipe configs found');
  async.each(files, function(file, cb) {
    api.logger.debug('Loading logpipe: ' + file);
    fs.readFile(file, {encoding: 'utf8'}, function(err, data) {
      if(err) return cb(err);
      try {
        var doc = yaml.safeLoad(data);
        doc.configFile = file;
        api.logpipes.push(doc);
        cb();
      } catch(e) {
        cb(yamlParseError(file, e));
      }
    });
  }, cb);
}

function applyPresets(cb) {
  api.logpipes = api.logpipes.map(function(cfg) {
    if(cfg.preset) {
      return _.merge(api.presets[cfg.preset], cfg, function(a, b) {
        if(_.isEmpty(b)) return a;
        if(_.isArray(a)) return a.concat(b);
        return b;
      });
    } else {
      return cfg;
    }
  });
  cb();
}


api.addBootstrapFunc(async.parallel.bind(this, [loadConfig, loadLogpipes, loadPresets]));
api.addBootstrapFunc(applyPresets);
