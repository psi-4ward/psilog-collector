var events = require('events');
var util = require('util');
var async = require('async');

function Api() {
  var api = this;
  events.EventEmitter.call(this);

  this.inputs = {};
  this.splitters = {};
  this.parsers = {};
  this.transformers = {};
  this.outputs = {};
  this._asyncBootstrapFuncs = [];

  setTimeout(function() {
    async.series(api._asyncBootstrapFuncs, function(err) {
      if(err) return api.logger.error(err);
      api.emit('ready');
    });
  }, 0);
}
util.inherits(Api, events.EventEmitter);

Api.prototype.addBootstrapFunc = function(func) {
  this._asyncBootstrapFuncs.push(func);
};

module.exports = new Api();