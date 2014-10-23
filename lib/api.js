var events = require('events');
var util = require('util');
var async = require('async');
var path = require('path');

function Api() {
  var api = this;
  events.EventEmitter.call(this);

  this.inputs = {};
  this.splitters = {};
  this.parsers = {};
  this.transformers = {};
  this.outputs = {};
  this._asyncBootstrapFuncs = [];
  this._shutdownFuncs = [];
  this.rootdir = path.resolve(__dirname + '/..');

  setTimeout(function() {
    async.series(api._asyncBootstrapFuncs, function(err) {
      if(err) return api.logger.error(err);
      api.emit('ready');
    });
  }, 0);

  process.on('SIGTERM', this._shutdown.bind(this));
  process.on('SIGHUP', this._shutdown.bind(this));
  process.on('SIGINT', this._shutdown.bind(this));
}
util.inherits(Api, events.EventEmitter);

Api.prototype.addBootstrapFunc = function(func) {
  this._asyncBootstrapFuncs.push(func);
};

Api.prototype.addShutdownFunc = function(func) {
  this._shutdownFuncs.push(func);
};

Api.prototype._shutdown = function() {
  async.parallel(this._shutdownFuncs, function (err) {
    var code = 0;
    if (err) {
      api.logger.error(err);
      code = 1;
    }
    process.exit(code)
  });
};

module.exports = new Api();