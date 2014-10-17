var exec = require('child_process').exec;
var api = require('../../api.js');
var Readable = require('stream').Readable;


api.inputs.load = function(config, cb) {
  if([60, 60*5, 60*15].indexOf(config.interval) < 0) {
    api.logger.warn('[' + config.name + ']', 'You sould use an interval of 60, 300 or 900 seconds!');
  }

  var rs = new Readable({objectMode: true});
  rs._read = function () {};

  // find CPU/Cores count to calc load-percentage
  exec("grep 'model name' /proc/cpuinfo | wc -l", function(err, stdout, stderr) {
    if(err || stderr) {
      api.logger.error('[' + config.name + ']', err, stderr.toString());
      return;
    }

    var cpuCount = parseInt(stdout.toString().trim(), 10);
    setInterval(pushData.bind(this, rs, config, cpuCount), config.interval * 1000);

    api.logger.info('[' + config.name + ']', 'start measuring load every ' + config.interval + ' seconds');
    cb(null, rs);
  });

};


function pushData(readstream, config, cpuCount) {
  exec('LC_ALL=C uptime', function(err, stdout, stderr) {
    if(err || stderr) {
      api.logger.error('[' + config.name + ']', err, stderr.toString());
      return;
    }

    var match = stdout.toString().trim().match(/.*: (\d+\.\d+), (\d+\.\d+), (\d+\.\d+) *$/);

    var load;
    // support 1, 5, 15 min measurings from uptime
    if(config.interval <= 60) load = parseFloat(match[1], 10);
    else if(config.interval <= 300) load = parseFloat(match[2], 10);
    else load = parseFloat(match[3], 10);

    readstream.push({
      _type: 'metrics',
      "@timestamp": (new Date()).getTime(),
      class: 'load',
      metric_value: load,
      percent: load / cpuCount * 100
    });
  });
}
