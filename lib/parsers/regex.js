/* Parsers: regex
 * Generate the object using a regex.
 * @param {string} regex
 * @params {array} fields
 */

var api = require('../api.js');
var util = require('util');
var _ = require('lodash');
var Transform = require('stream').Transform;


function RegexParser(regex, fields) {
  if(!(this instanceof RegexParser)) {
    return new RegexParser(regex, fields);
  }
  Transform.call(this, {objectMode:true});

  this.regex = regex;
  this.fields = fields;
}
util.inherits(RegexParser, Transform);


RegexParser.prototype._transform = function(buf, enc, cb) {
  if(!buf) {
    return cb();
  }
  var match = buf.toString().match(this.regex);

  api.logger.debug('Apply regex "' + this.regex.toString() + ' to', buf.toString());
  if(!match) {
    api.logger.warn('Regex did not match: '+buf.toString());
    return cb();
  }
  match.shift();

  this.push(_.zipObject(this.fields, match));
  cb();
};


api.parsers.regex = function(config) {
  if(typeof config.regex === 'string') {
    var match = config.regex.match(/^\/(.*)\/([gimy]*)$/);
    config.regex = new RegExp(match[1], match[2]);
  }
  return new RegexParser(config.regex, config.fields);
};