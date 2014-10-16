var exec = require('child_process').exec;
var api = require('../../api.js');
var Readable = require('stream').Readable;

api.inputs.diskusage = function(config, cb) {
  var rs = new Readable({objectMode: true});
  rs._read = function () {};

  setInterval(pushData.bind(this, rs, config), config.interval * 1000);

  api.logger.info('[' + config.name + ']', 'start measuring diskusage every ' + config.interval + ' seconds');
  cb(null, rs);
};


function pushData(readstream, config) {
  exec('df -l', function(err, stdout, stderr) {
    if(err || stderr) {
      api.logger.error('[' + config.name + ']', err, stderr.toString());
      return;
    }

    var lines = stdout.split(/\r?\n/);
    lines.shift(); // drop headlines

    lines.forEach(function(line) {
      var rows = line.split(/ +/);

      // only /dev, drop tempfs etc
      if(rows[0].substr(0, 4) !== '/dev') return;

      rows[2] = parseInt(rows[2], 10);
      rows[3] = parseInt(rows[3], 10);

      readstream.push({
        _type: 'metrics',
        "@timestamp": Math.round((new Date()).getTime() / 1000),
        class: 'diskusage',
        subclass: rows[0],
        metric_value: rows[2],
        percent: rows[2] / (rows[2]+rows[3]) * 100
      });
    });
  });
}