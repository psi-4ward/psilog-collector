var util = require('util');
var Transform = require('stream').Transform;

function StringifyJson() {
  if(!(this instanceof StringifyJson)) {
    return new StringifyJson();
  }
  Transform.call(this, {objectMode: true});
}
util.inherits(StringifyJson, Transform);


StringifyJson.prototype._transform = function(obj, enc, cb) {
  this.push(JSON.stringify(obj) + "\r\n");
  cb();
};

api.formatters.stringifyJson = function() {
  return new StringifyJson();
};