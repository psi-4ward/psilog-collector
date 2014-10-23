var api = require('./api.js');
var winston = require('winston');

function pad(v) {
  v = v.toString();
  return (v.length < 2) ? '0'+ v : v;
}

api.logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: api.argv.loglevel,
      colorize: true,
      timestamp: function() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth()) + '-' + pad(d.getDate())
               + ' '
               + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      }
    })
  ]
});