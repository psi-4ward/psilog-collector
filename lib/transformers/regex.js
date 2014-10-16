/* Transfomer: Regexer
 * populate fields if the regex matches
 * @param {string} srcField     source field, must contain a string
 * @param {string|array} regex  The Regex
 * @param {string|array} fields Fieldnames to populate when the regex matches
 */

var api = require('../api.js');
var util = require('util');
var _ = require('lodash');
var Transform = require('stream').Transform;


function RegexTransformer(srcField, regex, fields) {
  if(!(this instanceof RegexTransformer)) {
    return new RegexTransformer(srcField, regex, fields);
  }
  Transform.call(this, {objectMode:true});

  // be sure to have arrays
  if(!_.isArray(regex)) {
    regex = [regex];
    fields = [fields];
  }

  this.srcField = srcField;
  this.regex = regex;
  this.fields = fields;


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
util.inherits(RegexTransformer, Transform);


RegexTransformer.prototype._transform = function(obj, enc, cb) {
  for(var i = 0; i < this.regex.length; i++) {
    api.logger.debug('Apply regex "' + this.regex[i].toString() + ' to', obj[this.srcField]);

    var match = obj[this.srcField].match(this.regex[i]);
    if(match) {
      match.shift();
      for(var j = 0; j < match.length; j++) {
        obj[this.fields[i][j]] = match[j];
      }
    }
  }

  this.push(obj);
  cb();
};


api.transformers.regex = function(cfg) {
  return new RegexTransformer(cfg.srcField, cfg.regex, cfg.fields);
};