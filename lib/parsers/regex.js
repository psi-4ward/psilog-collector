/* Parsers: regex
 * Generate the object using a regex.
 * @param {string|array} regex
 * @param {array} fields
 * @param {bool} nowarn suppress warning if no regex matches
 */

var api = require('../api.js');
var util = require('util');
var _ = require('lodash');
var Transform = require('stream').Transform;


function RegexParser(regex, fields, nowarn, name) {
  if(!(this instanceof RegexParser)) {
    return new RegexParser(regex, fields);
  }
  Transform.call(this, {objectMode:true});

  // be sure to have arrays
  if(!_.isArray(regex)) {
    regex = [regex];
    fields = [fields];
  }

  this.regex =  regex;
  this.fields = fields;
  this.nowarn = nowarn;
  this.name = name;

  // convert string representation to RegExp obj
  this.regex = this.regex.map(function(val) {
    if(typeof val === 'string') {
      var match = val.match(/^\/(.*)\/([gimy]*)$/);
      return new RegExp(match[1], match[2]);
    } else {
      return val;
    }
  });
}
util.inherits(RegexParser, Transform);


RegexParser.prototype._transform = function(buf, enc, cb) {
  if(!buf) return cb();

  for(var i = 0; i < this.regex.length; i++) {
    api.logger.debug('Apply regex "' + this.regex[i].toString() + ' to', buf.toString());

    var match = buf.toString().match(this.regex[i]);
    if(match) {
      match.shift();
      this.push(_.zipObject(this.fields[i], match));
      return cb();
    }
  }

  if(!this.nowarn) api.logger.warn('[' + this.name + ']', 'No Regex did match: '+buf.toString());
  return cb();
};


api.parsers.regex = function(config) {
  return new RegexParser(config.regex, config.fields, config.nowarn, config.name);
};