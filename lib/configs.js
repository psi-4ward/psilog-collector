var api = require('./api');
var yaml = require('js-yaml');
var glob = require("glob");
var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('lodash');
var winston = require('winston');


function yamlParseError(file, e) {
  return 'Could not parse ' + file + ": " + e.message.substr(9);
}


function loadConfig(cb) {
  async.each(api.argv.configdir, function(confdir, cb) {
    fs.readFile(api.argv.configdir + '/main.yml', {encoding: 'utf8'}, function(err, data) {
      if(err) return cb();
      api.logger.debug('Loading config: ' + api.argv.configdir + '/main.yml');
      try {
        api.config = yaml.safeLoad(data);

        if(!api.argv.loglevel && api.config.log && api.config.log.level) {
          api.logger.transports.console.level = api.config.log.level;
        }
        if(api.config.log && api.config.log.file) {
          api.logger.info('Logging to: ' + api.config.log.file);
          api.logger.add(winston.transports.File, {
            level: api.logger.transports.console.level,
            timestamp: api.logger.transports.console.timestamp,
            filename: api.config.log.file,
            json: false
          });
        }
        cb();
      }
      catch(e) {
        cb(yamlParseError(api.argv.configdir + '/main.yml', e));
      }
    });
  }, cb);
}


function loadPresets(cb) {
  async.each(api.argv.configdir, function(confdir, cb) {
    api.presets = {};
    var files = glob.sync(confdir + "/presets/**/*.yml");
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
  }, cb);
}


function loadLogpipes(cb) {
  async.each(api.argv.configdir, function(confdir, cb) {
    api.logpipes = [];

    var files;
    if(api.argv.logpipe) {
      files = [api.argv.logpipe];
    } else {
      files = glob.sync(confdir + "/logpipes/**/*.yml");
    }

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
  }, cb);
}


function applyPresets(cb) {
  api.logpipes = api.logpipes.map(function(cfg) {

    if(cfg.preset) {
      if(!api.presets[cfg.preset]) {
        api.logger.error('Preset ' + cfg.preset + ' not found, referenced in ' + cfg.configFile);
        return cfg;
      }

      return _.merge(api.presets[cfg.preset], cfg, function(a, b) {
        if(_.isEmpty(b)) return a;
        if(_.isArray(a)) return a.concat(b);
        return b;
      });
    }

    return cfg;
  });
  cb();
}


api.addBootstrapFunc(async.parallel.bind(this, [loadConfig, loadLogpipes, loadPresets]));
api.addBootstrapFunc(applyPresets);
