var api = require('../../api.js');
var Readable = require('stream').Readable;
var Modem = require('docker-modem');
var _ = require('lodash');
var async = require('async');
Modem = new Modem();


api.inputs.docker = function(config, cb) {
  var rs = new Readable({objectMode: true});
  rs._read = function() {};
  if(!config.interval) config.interval = 15;

  setInterval(pushData.bind(this, rs, config), config.interval * 1000);
  pushData(rs, config);

  api.logger.info('[' + config.name + ']', 'start measuring docker containers ' + config.interval + ' seconds');
  cb(null, rs);
};

function container_inspect(cid, cb) {
  Modem.dial({
    path: '/containers/' + cid + '/json',
    method: 'GET',
    statusCodes: {
      200: true,
      404: "no such container",
      500: "server error"
    }
  }, cb);
}

function container_stats(cid, cb) {
  Modem.dial({
    path: '/containers/' + cid + '/stats',
    method: 'GET',
    isStream: true,
    statusCodes: {
      200: true,
      404: "no such container",
      500: "server error"
    }
  }, function(err, stream) {
    if(err) return cb(err);
    stream.on('data', function(buff) {
      stream.destroy();
      cb(null, JSON.parse(buff));
    })
  });
}

function pushData(readstream, config) {
  // fetch all running containers
  Modem.dial({
    path: '/containers/json?status=running',
    method: 'GET',
    statusCodes: {
      200: true,
      400: "bad parameter",
      500: "server error"
    }
  }, function(err, runningContainers) {
    if(err) {
      api.logger.error(err.toString());
      return;
    }
    async.eachLimit(runningContainers, 10, function(container, next) {

      container_stats(container.Id, function(err, stats) {
        if(err) {
          api.logger.error(err.toString());
          return next();
        }
        var name = container.Names[0].substr(1);

        readstream.push({
          _type: 'docker',
          "@timestamp": (new Date()).getTime(),
          name: name,
          network: stats.network,
          memory: stats.memory_stats,
          blkio: stats.blkio_stats,
          cpu: stats.cpu_stats
        });

        next();
      });
    });
  });
}

