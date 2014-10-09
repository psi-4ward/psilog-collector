/*
 * Transform the input stream buffers into string object
 * line by line
 */

var api = require('../api.js');
var split = require('split2');

api.splitters.line = function() {
  return split();
};
