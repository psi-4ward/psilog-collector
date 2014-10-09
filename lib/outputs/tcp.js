/* Output: tcp
 *
 */

var api = require('../api.js');
var net = require('net');


api.outputs.tcp = function(config) {
  var con = net.createConnection({
    host: config.host,
    port: config.port
  });

  if(config.password) {
    con.write(config.password+"\r\n");
  }

  con.on('connect', function() {
    api.logger.info('['+config.name+']', 'TCP connection to ' + config.host+':'+config.port + ' established');
  });

  con.on('end', function() {
    api.logger.info('['+config.name+']', 'TCP connection to ' + config.host+':'+config.port + ' closed');
  });

  con.on('error', function(e) {
    api.logger.error('['+config.name+']', 'Can not connect to ' + config.host+':'+config.port, e);
  });

  var ws = new StringifyJson();
  ws.pipe(con);

  return ws;
};