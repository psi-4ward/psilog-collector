var glob = require('glob');
var api = require('./api');
var path = require('path');

function loader(globStr, cb) {
    glob(globStr, function(err, files) {
    if(err) return cb(err);
    files.forEach(function(file) {
      require(path.resolve(file));
    });
    cb();
    });
}

api.addBootstrapFunc(loader.bind(this, 'lib/inputs/*.js'));
api.addBootstrapFunc(loader.bind(this, 'lib/splitters/*.js'));
api.addBootstrapFunc(loader.bind(this, 'lib/parsers/*.js'));
api.addBootstrapFunc(loader.bind(this, 'lib/transformers/*.js'));
api.addBootstrapFunc(loader.bind(this, 'lib/outputs/*.js'));