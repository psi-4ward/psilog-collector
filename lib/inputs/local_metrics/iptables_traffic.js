/**
 * Measure traffic from iptables chains
 *
 * @param {string} chain    Chain-Name
 * @param {int} [interval]  Interval in s [60]
 *
 * Iptables script example:
 *
 #!/bin/sh

 echo "Initialisiere Iptables rules..."

 # Reset iptables
 iptables -F
 iptables -X

 # Create chain
 iptables -N MYACCEPT

 # Set policy (allow erverything)
 iptables -P INPUT ACCEPT
 iptables -P OUTPUT ACCEPT

 # Allow all on loopback and forward to ACCEPT
 iptables -A INPUT -i lo -j ACCEPT
 iptables -A OUTPUT -o lo -j ACCEPT

 # Forward traffic to our counting chain
 iptables -A INPUT -j MYACCEPT
 iptables -A OUTPUT -j MYACCEPT

 # Counting chain
 iptables -A MYACCEPT -p tcp -m multiport --ports 80,443 -m comment --comment "Name: HTTP"
 iptables -A MYACCEPT -p tcp -m multiport --ports 25,110,143,465,993,995 -m comment --comment "Name: Mail"
 iptables -A MYACCEPT -p tcp -m multiport --ports 22 -m comment --comment "Name: SSH"
 iptables -A MYACCEPT -p tcp -m multiport --ports 18328 -m comment --comment "Name: BackupPC"
 iptables -A MYACCEPT -p tcp -m multiport ! --ports 25,110,143,465,993,995,80,443,22 -m comment --comment "Name:other TCP"
 iptables -A MYACCEPT -p udp -m multiport --ports 53 -m comment --comment "Name: DNS"
 iptables -A MYACCEPT -p udp -m multiport --ports 123 -m comment --comment "Name: NTP"
 iptables -A MYACCEPT -p udp -m multiport ! --ports 53,123 -m comment --comment "Name: other UDP"
 iptables -A MYACCEPT -j ACCEPT

 echo "Iptables running"
 */

var exec = require('child_process').exec;
var api = require('../../api.js');
var Readable = require('stream').Readable;

api.inputs.iptables_traffic = function(config, cb) {
  if(!config.chain) return cb('chain parameter missing in ' + config.configFile);
  if(!config.interval) config.interval = 60;

  var rs = new Readable({objectMode: true});
  rs._read = function () {};

  setInterval(pushData.bind(this, rs, config), config.interval * 1000);

  api.logger.info('[' + config.name + ']', 'start measuring iptables traffic every ' + config.interval + ' seconds');
  cb(null, rs);
};


function pushData(readstream, config) {
  exec('ssh root@marvin.4wardmedia.de iptables -vnxZ -t filter -L '+config.chain, function (err, stdout, stderr) {
    if (err || stderr) {
      api.logger.error('[' + config.name + ']', stderr.toString());
      return;
    }

    var lines = stdout.toString().trim().split(/r?\n/);

    var sum = parseInt(lines[lines.length-2].match(/[^ ]* (\d+).*/), 10);

    var bytes;
    for(var i=2; i<lines.length-2; i++) {
      var match = lines[i].match(/[^ ]* (\d+) .* Name:([a-zA-Z0-9 _-]+)/);

      if(!match) {
        api.logger.warn('[' + config.name + ']', 'count not parse line:', lines[i]);
        continue;
      }

      bytes = parseInt(match[1], 10);
      readstream.push({
        _type: 'metrics',
        "@timestamp": (new Date()).getTime(),
        class: 'iptables_traffic',
        subclass: match[2].trim(),
        metric_value: bytes,
        percent: bytes / sum * 100
      });
    }

  });
}
