/* Transfomer: useragentDetector
 * Parse the useragent from an http-request and store
 * the result object in *useragent_paresed* field
 * @param {string} useragentField the name of the field holding the useragent string
 */

var api = require('../api.js');
var util = require('util');
var Transform = require('stream').Transform;
var useragent = require('useragent');

function UseragentDetector(useragentField) {
  if(!(this instanceof UseragentDetector)) {
    return new UseragentDetector(useragentField);
  }
  Transform.call(this, {objectMode:true});

  this.useragentField = useragentField || 'useragent';
}
util.inherits(UseragentDetector, Transform);


UseragentDetector.prototype._transform = function(obj, enc, cb) {
  api.logger.debug('Parsing useragent string in field "' + this.useragentField + '"');
  if(obj[this.useragentField]) {
    obj.useragent_parsed = useragent.parse(obj[this.useragentField]).toJSON();
  }

  this.push(obj);
  cb();
};


api.transformers.useragentDetector = function(config) {
  return new UseragentDetector(config.useragentField);
};