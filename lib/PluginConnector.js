const Module = require('./PluginModule');

class Connector extends Module {
  constructor(options) {
    options.type = 'connector';
    super(options);
  }
}

module.exports = Connector;
