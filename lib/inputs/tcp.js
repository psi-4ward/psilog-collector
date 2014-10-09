/* Input: tcp
 * listen for tcp connections sending data
 * @param {string} ip         the bind ip
 * @param {string} port       default 6543
 * @param {string} [password] an optional password
 */

var api = require('../api.js');
var net = require('net');
var util = require('util');

api.inputs.tcp = function(config, cb) {
  config.port = config.port || 6543;

  var svr = net.createServer(function(con) {
    var remoteAddr = con.remoteAddress;
    var remotePort = con.remotePort;
    api.logger.info('['+config.name+']', 'TCP connect from', remoteAddr + ':' + remotePort);

    con.on('end', function() {
      api.logger.info('['+config.name+']', 'TCP', remoteAddr + ':' + remotePort, 'disconnected');
    });

    if(config.password) {
      var data = '';

      function auth() {
        // catch all chars
        data += con.read().toString();
        var match = data.split(/\r?\n/);
        if(match.length > 1) {
          con.removeListener('readable', auth);
          if(match[0] !== config.password) {
            // auth failed: end stream and close connection
            api.logger.warn('['+config.name+']', 'TCP', remoteAddr + ':' + remotePort, 'auth faild, wrong password:', util.inspect(match[0]));
            con.end();
          } else {
            // auth success: push back remaining data an pipe the stream
            api.logger.debug('['+config.name+']', 'TCP', remoteAddr + ':' + remotePort, 'auth successful');
            match.shift();
            con.push(match.join("\r\n"));
            cb(null, con);
          }
        } else {
          data += data;
        }
      }

      con.on('readable', auth);
    } else {
      cb(null, con);
    }

  });

  api.logger.info('['+config.name+']', 'TCP server listening on', (config.ip || '0.0.0.0') + ':' + config.port);
  svr.listen(config.port, config.ip);
};

