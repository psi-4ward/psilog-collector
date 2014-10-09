/* Transfomer: anonymizeIp
 * scramble the last octet of an ip-address
 * @param {string} ipField the name of the field holding the IP
 */

var api = require('../api.js');
var util = require('util');
var Transform = require('stream').Transform;


function AnonymizeIp(ipField) {
  if(!(this instanceof AnonymizeIp)) {
    return new AnonymizeIp(ipField);
  }
  Transform.call(this, {objectMode:true});
  this.ipField = ipField || 'ip';
}
util.inherits(AnonymizeIp, Transform);


AnonymizeIp.prototype._transform = function(obj, enc, cb) {
  api.logger.debug('Anonymize IP in field "' + this.ipField + '"');
  if(obj.ip && obj.ip.match(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/)) {
    obj.ip = obj.ip.replace(/\.[0-9]{1,3}$/,'.0');
  }
  // IPv6 UNTESTED !
  else if(obj.ip && obj.ip.match(/(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/)) {
    obj.ip = obj.ip.replace(/:[^:]*$/,':0');
  } else {
    api.logger.warn('Could not anonymize IP, field value:', obj.ip);
  }

  this.push(obj);
  cb();
};


api.transformers.anonymizeIp = function(config) {
  return new AnonymizeIp(config.ipField);
};