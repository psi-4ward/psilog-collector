var api = require('./api.js');

/**
 * Transform the yaml-object
 * @param {Object|String} obj
 * @returns {Object} obj
 */
function getCfg(obj, cfg) {
  var r = obj;
  if(typeof obj == 'string' || obj instanceof String) {
    r = {type: obj};
  }
  r.name = cfg.name || '';
  return r;
}

module.exports = {

  /**
   * Init all logpipes
   */
  init: function initLogpipes()
  {
    api.logpipes.forEach(function(cfg) {

      // async get input stream
      var inputCfg = getCfg(cfg.input, cfg);
      api.inputs[inputCfg.type](inputCfg, function(err, stream) {
        if(err) {
          api.logger.error('[' + cfg.name + ']', err);
          return;
        }

        // pipe to splitter if necessary
        // it should convert the input-buffers to strings objects
        if(cfg.splitter) {
          var splitterCfg = getCfg(cfg.splitter, cfg);
          stream = stream.pipe(api.splitters[splitterCfg.type](splitterCfg));
        }

        // pipe to parser if necessary
        // it should convert the string objets to JSON
        if(cfg.parser) {
          var parserCfg = getCfg(cfg.parser, cfg);
          stream = stream.pipe(api.parsers[parserCfg.type](parserCfg));
        }

        // pipe thorugh all transformers to alter the object
        if(cfg.transformers) {
          cfg.transformers.forEach(function(transformer) {
            var transformerCfg = getCfg(transformer, cfg);
            stream = stream.pipe(api.transformers[transformerCfg.type](transformerCfg));
          });
        }

        // pipe to an output
        var outputCfg = getCfg(cfg.output, cfg);
        stream.pipe(api.outputs[outputCfg.type](outputCfg));
      });
    });
  }

};