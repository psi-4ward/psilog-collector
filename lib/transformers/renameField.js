/*
 * @param {string} ipField the name of the field holding the IP
 */

var api = require('../api.js');
var util = require('util');
var Transform = require('stream').Transform;
var _ = require('lodash');

function RenameField(fields) {
  if(!(this instanceof RenameField)) {
    return new RenameField(fields);
  }
  Transform.call(this, {objectMode:true});

  // be sure to have arrays
  if (!_.isArray(fields)) {
    fields = [fields];
  }

  this.fields = fields;
}
util.inherits(RenameField, Transform);


RenameField.prototype._transform = function(obj, enc, cb) {

  if( this.fields.length >0 ) {

    this.fields.forEach(function(field) {

      if( ! _.isObject(field)) {
        api.logger.warn('expecting an object on renameField transformer');
        return;
      }

      var oldKey = Object.keys(field).pop(),
        newKey = field[oldKey],
        value = obj[oldKey];

      if( ! obj[oldKey]) {

        api.logger.info('renaming field "' + oldKey + '": property ignored as not existing on obj')
      }

      delete obj[oldKey];

      obj[newKey] = value;
    }.bind(this));

    obj = _.extend({}, obj); // removing undefined valued for renamed properties
  }

  this.push(obj);
  cb();
};


api.transformers.renameField = function(config) {

  return RenameField(config.fields);
};