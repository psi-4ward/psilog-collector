/** Output: elasticsearch
 *
 * Put a JSON into elasticsearch _bulk
 * * streams the data until maxRequestSize is reached
 * * ends a request at least every flushtime ms
 * * opens maximally maxRequestsPerHost per host:port combination
 *
 * @param {string} host          The elasticsearch host
 * @param {int}    port          The elastichsearch port
 */

var api = require('../api.js');
var _ = require('lodash');
var moment = require('moment');
var stream = require('stream');
var http = require('http');
var urlParser = require('url').parse;

var maxRequestSize = 500 * 1024;
var maxRequestsPerHost = 5;
var flushtime = 5000;
if(api.config.elasticsearch) {
  if(api.config.elasticsearch.maxRequestSize) maxRequestSize = parseInt(api.config.elasticsearch.maxRequestSize, 10);
  if(api.config.elasticsearch.maxRequestsPerHost) maxRequestsPerHost = api.config.elasticsearch.maxRequestsPerHost;
  if(api.config.elasticsearch.flushtime) flushtime = api.config.elasticsearch.flushtime * 1000;
}

var currentRequests = {};
var waitingCBs = {};
var runningRequests = {};
var reqCounter = 0;

api.outputs.elasticsearch = function(config) {
  config = _.defaults(config, {
    host: 'localhost',
    port: 9200
  });
  var url = 'http://' + config.host + ':' + config.port + '/_bulk';

  var ws = stream.Writable({objectMode: true});

  ws._write = function(obj, enc, next) {
    var date;
    if(obj['@timestamp']) date = moment(obj['@timestamp']);
    else date = moment();

    var data = JSON.stringify({
        index: {
          _index: 'psilog-' + date.format('YYYY-MM-DD'),
          //_index: 'psilog',
          _type: obj._type || 'default'
        }
      }) + "\r\n";

    if(obj._type) delete obj._type;
    data += JSON.stringify(obj) + "\r\n";

    send(url, data, next);
  };

  return ws;
};


function send(url, data, cb) {
  var req;

  // generate a new request if theres none
  if(!currentRequests[url]) {
    reqCounter++;
    api.logger.debug(reqCounter, 'Generating POST request to', url);

    req = http.request(_.merge(urlParser(url), {method: 'POST'}), function responseHandler(res) {
      // collect response data
      var data = '';
      res.on('data', function(chunk) {
        data += chunk.toString();
      });

      // response end
      res.on('end', function() {
        clearTimeout(req.timer);
        runningRequests[url]--;

        if(res.statusCode >= 400) {
          api.logger.error(req.num, url + ' response ' + res.statusCode, data);
        } else {
          api.logger.debug(req.num, 'Request to ' + url + ' ended');
        }

        try {
          data = JSON.parse(data);
          if(data.errors) {
            api.logger.error('Elasticsearch response contains errors', data);
          }
        } catch(e) {
          api.logger.error('Counld not parse elasticsearch response', data);
        }

        // invoke delayed callback
        if(waitingCBs[url]) {
          var x = waitingCBs[url];
          waitingCBs[url] = false;
          x();
        }
      });
    });

    req.num = reqCounter;
    req.bytes = 0;

    req.on('error', function(e) {
      if(e.code === 'ECONNREFUSED') {
        api.logger.error(url, 'connection refused');
      } else {
        api.logger.error(e);
      }
    });

    // flush the request after a certain time
    req.timer = setTimeout(function() {
      api.logger.debug(req.num, 'Flushtime reached for ' + url);
      currentRequests[url] = false;
      req.end();
    }, flushtime);

    currentRequests[url] = req;
    runningRequests[url] = ++runningRequests[url] || 1
  } else {
    req = currentRequests[url];
  }

  req.write(data);
  req.bytes = req.bytes + data.length;

  // End the request if full
  if(req.bytes >= maxRequestSize) {
    api.logger.debug(req.num, 'Request is full, end it ' + url);
    currentRequests[url] = false;
    clearTimeout(req.timer);
    req.end();
  }

  // request queue full, wait for a finishd request
  if(runningRequests[url] > maxRequestsPerHost) {
    waitingCBs[url] = cb;
    warnMsgDebounced('Request queue for ' + url + ' full, network or elasticsearch-indexer not fast enough');
  } else {
    cb();
  }
}

var warnMsgDebounced = _.debounce(function(msg) {
  api.logger.warn(msg);
}, 30000);