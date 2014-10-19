/* Transfomer: parseDate
 * Convert a Date string into an unix timestamp with milliseconds
 * Uses momentjs http://momentjs.com/docs/#/parsing/string-format/
 * @param {string} field The name of the field holding the date string
 * @param {string} format The momentjs date format
 */

var api = require('../api.js');
var util = require('util');
var moment = require('moment');
var Transform = require('stream').Transform;


function ParseDate(field, target, format, name) {
  if(!(this instanceof ParseDate)) {
    return new ParseDate(field, target, format);
  }
  Transform.call(this, {objectMode:true});
  this.field = field;
  this.target = target;
  this.format = format;
  this.name = name;
}
util.inherits(ParseDate, Transform);


ParseDate.prototype._transform = function(obj, enc, cb) {
  api.logger.debug('Transforming date from field "' + this.field + '" into timestamp');
  if(obj[this.field]) {
    var d = moment(obj[this.field], this.format);
    if(d.isValid()) {
      obj[this.target] = +d;
    } else {
      api.logger.warn('[' + config.name + ']', 'Could not parse Date:' + obj[this.field]);
    }
  }
  this.push(obj);
  cb();
};


api.transformers.parseDate = function(config) {
  return new ParseDate(config.field || '@timestamp', config.target || '@timestamp', config.format, config.name);
};
