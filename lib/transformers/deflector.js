/* Transfomer: deflector
 * pipe the stream to different collections of transformers based on fieldvalue
 * @param {string} field  holding the value of collection types
 */

var api = require('../api.js');
var util = require('util');
var Transform = require('stream').Transform;


function Deflector(config) {
  if(!(this instanceof Deflector)) {
    return new Deflector(config);
  }
  Transform.call(this, {objectMode: true});

  var self = this;
  this.config = config;

  // create transformer pipelines
  this.pipes = {};
  config.pipes.forEach(function(pipeCfg) {
    var streams = [];
    
    // init transformers
    pipeCfg.transformers.forEach(function(transformerCfg) {
      transformerCfg.inputStream = config.inputStream;
      transformerCfg.name = config.name + ':' + transformerCfg.type;
      streams.push(new api.transformers[transformerCfg.type](transformerCfg));
    });

    // pipe streams together
    if(streams.length === 1) {
      self.pipes[pipeCfg.name] = streams[0];
    } else {
      (function piper(streams) {
        if(streams.length < 2) return;
        streams[0].pipe(streams[1]);
        piper(streams.slice(1))
      })(streams);

      self.pipes[pipeCfg.name] = streams[0];
      var end = streams[streams.length - 1];
      //self.transfomers[pipeCfg.name] = duplexer(streams[0], streams[streams.length-1]);

      // write pipe output to Deflector output
      end.on('readable', function() {
        self.push(end.read());
      });
    }
  });

}
util.inherits(Deflector, Transform);


Deflector.prototype._transform = function(obj, enc, cb) {
  var type = obj[this.config.field];
  api.logger.debug('[' + this.config.name + ']', 'deflector: ' + type);

  if(!this.pipes[type]) {
    api.logger.error('[' + this.config.name + ']', 'deflector unknowen type: ' + type);
    cb();
  } else {
    this.pipes[type].write(obj, enc, cb);
  }
};


api.transformers.deflector = function(cfg) {
  return new Deflector(cfg);
};