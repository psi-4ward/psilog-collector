var api = require('../../api.js');
var Readable = require('stream').Readable;
var Modem = require('docker-modem');
var _ = require('lodash');
var async = require('async');
Modem = new Modem();

var deltaCache = {};

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

function getMetrics(cid, stats, interval) {
  var metrics = [];
  var mtstamp = (new Date()).getTime();

  // Blkio
  var io_bytes = 0;
  var io_service_bytes_recursiveTotal = _.find(stats.blkio_stats.io_service_bytes_recursive, {op: 'Total'});
  if(io_service_bytes_recursiveTotal) io_bytes = io_service_bytes_recursiveTotal.value;

  if(deltaCache[cid]) {

    // CPU Usage
    var usedJiffies = stats.cpu_stats.cpu_usage.total_usage - deltaCache[cid].cpu_usage;
    var systemDelta = stats.cpu_stats.system_cpu_usage - deltaCache[cid].cpu_system;
    metrics.push({
      _type: 'metrics',
      "@timestamp": mtstamp,
      class: 'docker_container-cpu',
      metric_value: usedJiffies,
      percent: (usedJiffies / systemDelta) * stats.cpu_stats.cpu_usage.percpu_usage.length * 100.0
    });

    // Memory Usage (snapshot)
    metrics.push({
      _type: 'metrics',
      "@timestamp": mtstamp,
      class: 'docker_container-memory',
      metric_value: stats.memory_stats.usage,
      percent: stats.memory_stats.usage / stats.memory_stats.limit * 100
    });

    // Network
    metrics.push({
      _type: 'metrics',
      "@timestamp": mtstamp,
      class: 'docker_container-traffic',
      subclass: 'tx',
      metric_value: stats.network.tx_bytes - deltaCache[cid].network_tx,
      percent: null
    });
    metrics.push({
      _type: 'metrics',
      "@timestamp": mtstamp,
      class: 'docker_container-traffic',
      subclass: 'rx',
      metric_value: stats.network.rx_bytes - deltaCache[cid].network_rx,
      percent: null
    });

    // Blkio

    metrics.push({
      _type: 'metrics',
      "@timestamp": mtstamp,
      class: 'docker_container-blkio',
      subclass: 'io_service_bytes_recursive_total',
      metric_value: io_bytes - deltaCache[cid].io_bytes,
      percent: null
    });
  }

  // update cache
  if(deltaCache[cid] && deltaCache[cid]._timeout) clearTimeout(deltaCache[cid]._timeout);
  deltaCache[cid] = {
    cpu_usage: stats.cpu_stats.cpu_usage.total_usage,
    cpu_system: stats.cpu_stats.system_cpu_usage,
    network_tx: stats.network.tx_bytes,
    network_rx: stats.network.rx_bytes,
    io_bytes: io_bytes,
    _timeout: setTimeout(function() {
      delete deltaCache[cid];
    }, interval * 1000 * 1.5)
  };

  return metrics;
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

        getMetrics(container.Id, stats, config.interval)
          .map(function(metric) {
            metric.cid = container.Id;
            metric.name = name;
            return metric;
          })
          .forEach(readstream.push.bind(readstream));
        
/*
        readstream.push({
          _type: 'docker',
          "@timestamp": (new Date()).getTime(),
          name: name,
          network: stats.network,
          memory: stats.memory_stats,
          blkio: stats.blkio_stats,
          cpu: stats.cpu_stats
        });
*/

        next();
      });
    });
  });
}

