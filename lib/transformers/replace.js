/*
 * @param {string} ipField the name of the field holding the IP
 */

var api = require('../api.js');
var util = require('util');
var Transform = require('stream').Transform;
var _ = require('lodash');

function Replace(fields, search, replace) {
  if(!(this instanceof Replace)) {
    return new Replace(fields, search, replace);
  }
  Transform.call(this, {objectMode:true});

  // be sure to have arrays
  if (!_.isArray(fields)) {
    fields = [fields];
  }

  this.fields = fields;
  this.search = search;
  this.replace = replace;

  // convert string representation to RegExp obj
  var match;
  if (typeof val === 'string' && (match = val.match(/^\/(.*)\/([gimy]*)$/))) {
    this.search = new RegExp(match[1], match[2]);
  }

}
util.inherits(Replace, Transform);


Replace.prototype._transform = function(obj, enc, cb) {
  api.logger.debug('Search-replace in fields "' + this.fields.join(',') + '"');

  this.fields.forEach(function(field) {
    obj[field] = obj[field].toString().replace(this.search, this.replace)
  }.bind(this));

  this.push(obj);
  cb();
};


api.transformers.replace = function(config) {
  return new Replace(config.fields, config.search, config.replace);
};