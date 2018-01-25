const Module = require('./Module');

class Plugin extends Module {
  constructor(options = {}) {
    options.type = 'plugin';
    super(options);
  }
}

module.exports = Plugin;
