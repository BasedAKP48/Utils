const Module = require('./Module');
const move = require('../move');

class Connector extends Module {
  constructor(options = {}) {
    options.type = 'connector';
    options.listenMode = options.listenMode || 'connector';
    super(options);

    move(this.root, `config/clients/${this.cid}`, `config/${this.cid}`);
  }
}

module.exports = Connector;
