var fs = require('fs');
var api = require('../../api.js');
var Readable = require('stream').Readable;

api.inputs.iface_traffic = function(config, cb) {
  var rs = new Readable({objectMode: true});
  rs._read = function () {};

  var memory = {};
  setInterval(pushData.bind(this, rs, config, memory), config.interval * 1000);

  api.logger.info('[' + config.name + ']', 'start measuring interface traffic every ' + config.interval + ' seconds');
  cb(null, rs);
};


function pushData(readstream, config, memory) {
  fs.readFile('/proc/net/dev', {encoding: 'utf-8'}, function(err, data) {
    if(err) {
      api.logger.error('[' + config.name + ']', err);
      return;
    }

    var lines = data.split(/\r?\n/);
    // drop headlines
    lines.shift(); lines.shift();

    lines.forEach(function(line) {
      var rows = line.trim().split(/[ :]+/);

      var iface = rows[0];
      // dont measure loopback device
      if(!iface || iface === 'lo') return;

      var received = parseInt(rows[1], 10); // receive bytes
      var sent = parseInt(rows[9], 10); // sent bytes

      if(!memory[iface]) {
        // buffer the current memory on first call
        memory[iface] = {
          speed: getIfaceSpeed(iface),
          lastReceived: received,
          lastSent: sent,
          lastMtstamp: (new Date()).getTime()
        }
      } else {
        var mtstamp = (new Date()).getTime();
        var receivedDiff = received - memory[iface].lastReceived;
        var sentDiff = sent - memory[iface].lastSent;
        var timeElapsed = mtstamp - memory[iface].lastMtstamp;

        readstream.push({
          _type: 'metrics',
          "@timestamp": Math.round(mtstamp/1000),
          class: 'iface_traffic-received',
          subclass: iface,
          value: receivedDiff,
          percent: receivedDiff / (memory[iface].speed * timeElapsed / 1000) * 100
        });
        readstream.push({
          _type: 'metrics',
          "@timestamp": Math.round(mtstamp / 1000),
          class: 'iface_traffic-sent',
          subclass: iface,
          metric_value: sentDiff,
          percent: sentDiff / (memory[iface].speed * timeElapsed / 1000) * 100
        });

        memory[iface].lastReceived = received;
        memory[iface].lastSent = sent;
        memory[iface].lastMtstamp = mtstamp;
      }


    });
  });
}

function getIfaceSpeed(iface) {
  try {
    // Get MBit and return byte
    return parseInt(fs.readFileSync('/sys/class/net/' + iface + '/speed', {encoding: 'utf-8'}), 10) / 8 * 1024 * 1024;
  } catch(e) {
    return 0;
  }
}