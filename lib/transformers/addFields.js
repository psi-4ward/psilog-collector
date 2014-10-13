/* Transfomer: addFields
 * Add/Overwrite fields
 * @param {object} fields e.g. {myField: 'myValue'}
 */

var api = require('../api.js');
var util = require('util');
var _ = require('lodash');
var Transform = require('stream').Transform;


function AddFields(fields) {
  if(!(this instanceof AddFields)) {
    return new AddFields(fields);
  }
  Transform.call(this, {objectMode:true});
  this.fields = fields;
}
util.inherits(AddFields, Transform);


AddFields.prototype._transform = function(obj, enc, cb) {
  api.logger.debug('Merging fields', JSON.stringify(this.fields));
  this.push(_.merge(obj, this.fields));
  cb();
};


api.transformers.addFields = function(cfg) {
  return new AddFields(cfg.fields);
};