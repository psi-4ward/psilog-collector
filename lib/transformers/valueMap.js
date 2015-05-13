/* Transfomer: valueMap
 * Replace a value with another one
 * @param {array} fields e.g. 'myField'
 * @param {array} replace-hash e.g. {val1: 'newVal1'}
 */

var api = require('../api.js');
var util = require('util');
var _ = require('lodash');
var Transform = require('stream').Transform;


function ValueMap(fields, map) {
  if(!(this instanceof ValueMap)) {
    return new ValueMap(fields, map);
  }
  Transform.call(this, {objectMode: true});

  // be sure to have arrays
  if(!_.isArray(fields)) {
    fields = [fields];
  }

  this.fields = fields;
  this.map = map;
    console.log(map);
}
util.inherits(ValueMap, Transform);


ValueMap.prototype._transform = function(obj, enc, cb) {
  api.logger.debug('Map field values', JSON.stringify(this.fields));
  var self = this;
  this.fields.forEach(function(field) {
    if(!self.map[obj[field]]) return;

    obj[field] = self.map[obj[field]]
  });
  this.push(obj);
  cb();
};


api.transformers.valueMap = function(cfg) {
  return new ValueMap(cfg.fields, cfg.map);
};