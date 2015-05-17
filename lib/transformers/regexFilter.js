/*
 * Filter items by regex
 *
 * @param {Object} fields
 * @param {String} operator
 *
 * type: regexFilter
 * operator: or
 * filter:
 *   severity: Informational
 *   message:
 *     - "broken pipe"
 *     - stats
 */

var api = require('../api.js');
var util = require('util');
var Transform = require('stream').Transform;
var _ = require('lodash');

function Regexfilter(config) {
  if(!(this instanceof Regexfilter)) {
    return new Regexfilter(config);
  }
  Transform.call(this, {objectMode: true});

  _.forEach(config.fields, function(rgxps, fld) {
    if(!_.isArray(rgxps)) rgxps = [rgxps];
    config.fields[fld] = rgxps.map(function(rgxp) {
      // convert string representation to RegExp obj
      var match;
      if(typeof rgxp === 'string' && (match = rgxp.match(/^\/(.*)\/([gimy]*)$/))) {
        return new RegExp(match[1], match[2]);
      } else {
        return rgxp;
      }
    });
  });

  if(!config.operator) config.operator = 'OR';
  this.fields = config.fields;
  this.operatorFunc = config.operator.toUpperCase() === 'AND' ? 'every' : 'some';
  this.name = config.name;
}
util.inherits(Regexfilter, Transform);


Regexfilter.prototype._transform = function(obj, enc, cb) {
  var self = this;
  api.logger.debug('[' + this.name + ']', 'regexFilter for', Object.keys(this.fields).join(', '));

  if(!_[this.operatorFunc](this.fields, function(rgxps, fld) {
    return _.some(rgxps, function(rgxp) {
      var ret = obj[fld] && obj[fld].toString().match(rgxp);
      if(ret) {
        api.logger.debug('[' + self.name + '] regexFilter "' + rgxp + '" match for field ' + fld + '=' + obj[fld]);
      }
      return ret;
    });
  })) this.push(obj);

  cb();
};


api.transformers.regexFilter = function(config) {
  return new Regexfilter(config);
};