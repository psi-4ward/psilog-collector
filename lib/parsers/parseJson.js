/* Parsers: parseJson
 * JSON.parse()
 */

var api = require('../api.js');
var util = require('util');
var Transform = require('stream').Transform;


function JsonParser(config) {
  if(!(this instanceof JsonParser)) {
    return new JsonParser();
  }
  this.config = config;
  Transform.call(this, {objectMode:true});
}
util.inherits(JsonParser, Transform);


JsonParser.prototype._transform = function(buf, enc, cb) {
  if(!buf) {
    return cb();
  }

  api.logger.debug('[' + this.config.name + ']', 'Parse JSON:', buf.toString());
  try {
    var obj = JSON.parse(buf.toString());
  } catch(e) {
    api.logger.warn('[' + this.config.name + ']', 'Invalid JSON:', buf.toString());
    return cb();
  }

  this.push(obj);
  cb();
};


api.parsers.parseJson = function(config) {
  return new JsonParser(config);
};