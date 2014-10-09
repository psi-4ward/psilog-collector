/* Output: stdout
 * Print all objects on the stdout
 */

var api = require('../api.js');
var Writable = require('stream').Writable;

api.outputs.stdout = function() {
  var ws = Writable({objectMode:true});

  ws._write = function(obj, enc, next) {
    process.stdout.write(JSON.stringify(obj, null, 2)+"\r\n");
    next();
  };

  return ws;
};