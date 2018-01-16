const Module = require('./PluginModule');

class Connector extends Module {
  constructor(options) {
    options.type = 'connector';
    options.listenMode = options.listenMode || 'connector';
    super(options);

    const { emit } = this;
    this.root.child(`config/clients/${this.cid}`).on('value', (d) => {
      emit('config', d.val(), d.ref);
    });
  }
}

module.exports = Connector;
