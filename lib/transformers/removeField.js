/*
 * @param {string} ipField the name of the field holding the IP
 */

var api = require('../api.js');
var util = require('util');
var Transform = require('stream').Transform;
var _ = require('lodash');

function RemoveField(fields) {
  if(!(this instanceof RemoveField)) {
    return new RemoveField(fields);
  }
  Transform.call(this, {objectMode:true});

  // be sure to have arrays
  if (!_.isArray(fields)) {
    fields = [fields];
  }

  this.fields = fields;
}
util.inherits(RemoveField, Transform);


RemoveField.prototype._transform = function(obj, enc, cb) {

  this.fields.forEach(function(field) {
    delete obj[field];
  });

  this.push(obj);
  cb();
};


api.transformers.removeField = function(config) {

  return RemoveField(config.fields);
};