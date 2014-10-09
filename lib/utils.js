var api = require('./api');
var chalk = require('chalk');
var _ = require('lodash');

api.utils = {};

api.utils.printConfig = function() {
  console.log(chalk.bold(chalk.underline('PsiLog::collector v'+api.version)));
  console.log();
  console.log(chalk.bold('Configdir:'), api.argv.configdir);
  console.log();
  console.log(chalk.bold('Inputs:'), Object.keys(api.inputs).join(', '));
  console.log(chalk.bold('Splitters:'), Object.keys(api.splitters).join(', '));
  console.log(chalk.bold('Parsers:'), Object.keys(api.parsers).join(', '));
  console.log(chalk.bold('Transformers:'), Object.keys(api.transformers).join(', '));
  console.log(chalk.bold('Outputs:'), Object.keys(api.outputs).join(', '));
  console.log();
  console.log(chalk.bold('Presets:'), Object.keys(api.presets).join(', '));
  console.log();
  console.log(chalk.bold('Streams'));
  api.streamConfigs.forEach(function(cfg) {
    console.log(JSON.stringify(cfg, null, 2));
  });
};
