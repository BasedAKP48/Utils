const Module = require('./PluginModule');

class Connector extends Module {
  constructor(options) {
    options.type = 'connector';
    options.listenMode = options.listenMode || 'connector';
    super(options);
  }
}

module.exports = Connector;
