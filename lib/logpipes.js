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

      var inputCfg = getCfg(cfg.input, cfg);
      if(!api.inputs[inputCfg.type]) {
        api.logger.error('[' + cfg.name + ']', 'Input "' + inputCfg.type + '" not found!');
        return;
      }

      if(cfg.splitter) {
        var splitterCfg = getCfg(cfg.splitter, cfg);
        if(!api.splitters[splitterCfg.type]) {
          api.logger.error('[' + cfg.name + ']', 'Splitter "' + splitterCfg.type + '" not found!');
          return;
        }
      }

      if(cfg.parser) {
        var parserCfg = getCfg(cfg.parser, cfg);
        if(!api.parsers[parserCfg.type]) {
          api.logger.error('[' + cfg.name + ']', 'Parser "' + parserCfg.type + '" not found!');
          return;
        }
      }

      if(cfg.transformers) {
        var err = false;
        cfg.transformers.forEach(function(transformer) {
          var transformerCfg = getCfg(transformer, cfg);
          if(!api.transformers[transformerCfg.type]) {
            err = true;
            api.logger.error('[' + cfg.name + ']', 'Transformer "' + transformerCfg.type + '" not found!');
          }
        });
        if(err) return;
      }

      var outputCfg = getCfg(cfg.output, cfg);
      if(!api.outputs[outputCfg.type]) {
        api.logger.error('[' + cfg.name + ']', 'Input "' + outputCfg.type + '" not found!');
        return;
      }


      api.inputs[inputCfg.type](inputCfg, function(err, stream) {
        var inputStream = stream;
        if(err) {
          api.logger.error('[' + cfg.name + ']', err);
          return;
        }

        // pipe to splitter if necessary
        // it should convert the input-buffers to strings objects
        if(cfg.splitter) {
          splitterCfg.inputStream = inputStream;
          stream = stream.pipe(api.splitters[splitterCfg.type](splitterCfg));
        }

        // pipe to parser if necessary
        // it should convert the string objets to JSON
        if(cfg.parser) {
          parserCfg.inputStream = inputStream;
          stream = stream.pipe(api.parsers[parserCfg.type](parserCfg));
        }

        // pipe thorugh all transformers to alter the object
        if(cfg.transformers) {
          cfg.transformers.forEach(function(transformer) {
            var transformerCfg = getCfg(transformer, cfg);
            transformerCfg.inputStream = inputStream;
            stream = stream.pipe(new api.transformers[transformerCfg.type](transformerCfg));
          });
        }

        // pipe to an output
        outputCfg.inputStream = inputStream;
        stream.pipe(api.outputs[outputCfg.type](outputCfg));
      });
    });
  }

};