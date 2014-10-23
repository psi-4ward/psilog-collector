var yaml = require('js-yaml');
var glob = require("glob");
var fs = require('fs');
var async = require('async');
var _ = require('lodash');
var http = require('http');

var cmdargs = require("nomnom")
  .help('POST the mapping-tempaltes to elasticsearch')
  .option('host', {
    abbr: 'a',
    default: 'localhost',
    help: 'Elasticsearch host'
  })
  .option('port', {
    abbr: 'p',
    default: '9200',
    help: 'Elasticsearch port'
  })
  .option('configdir', {
    abbr: 'c',
    default: 'conf.d',
    help: 'Specify the directory holding the config files'
  })
  .option('show', {
    abbr: 's',
    flag: true,
    help: 'Show the current mapping configuration and exit'
  })
  .parse();


function loadMappings(cb) {
  var files = glob.sync(cmdargs.configdir + "/elasticsearch_mappings/**/*.yml");
  if(!files) cb('No files found in ' + cmdargs.configdir + "/elasticsearch_mappings");

  var mapping = {};
  async.each(files, function(file, next) {
    console.log('Loading:', file);
    
    fs.readFile(file, {encoding: 'utf8'}, function(err, data) {
      if(err) return next(err);
      try {
        var doc = yaml.safeLoad(data);
        mapping = _.extend(mapping, doc);
        next();
      }
      catch(e) {
        next('Could not parse ' + file + ": " + e.message.substr(9));
      }
    });
  }, function(err) {
    if(err) return cb(err);
    cb(null, mapping);
  });
}

loadMappings(function(err, mapping) {
  if(err) {
    console.error(err);
    process.exit(1);
  }

  if(cmdargs.show) {
    return console.log(JSON.stringify(mapping, null, '  '));
  }

  console.log('');
  console.log('Sending mapping to elasticsearch ...');
  var req = http.request(
    {
      hostname: cmdargs.host,
      port: cmdargs.port,
      path: '/_template/psilog',
      method: 'POST'
    },
    function(res) {
      console.log('STATUS: ' + res.statusCode);
      res.setEncoding('utf8');
      var d = '';
      res.on('data', function(chunk) {
        d += chunk.toString();
      });
      res.on('end', function () {
        console.log('RESPONSE: ', d);
        console.log('done');
      });
  });

  req.on('error', function(e) {
    console.error('Error: ' + e.message);
    process.exit(1);
  });

  req.write(JSON.stringify({
    template: 'psilog-*',
    mappings: mapping
  }));
  req.end();

});