const Module = require('./PluginModule');

class Plugin extends Module {
  constructor(options = {}) {
    options.type = 'plugin';
    super(options);
  }
}

module.exports = Plugin;
