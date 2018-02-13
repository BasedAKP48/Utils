const EventEmitter = require('events');
const M = require('../plugin/Module');
const hasRequired = require('../ensureRequired');
const forward = require('../eventForwarder');

class Config extends EventEmitter {
  constructor(options) {
    if (!hasRequired(options, ['root', 'cid'])) throw new Error('Missing options');
    super();
    if (options instanceof M) {
      options.on('destroy', () => this.emit('destroy'));
      forward(this, options, 'config/');
    }
    /** @type {Map<String, any>} */
    const map = new Map();
    const ref = options.root.child(`config/${this.cid}`);

    this.get = () => new Map(map);

    function add(v) {
      const key = v.key;
      const val = v.val();
      map.set(key, val);
      this.emit(key, val);
    }

    ref.on('child_added', add, null, this);

    ref.on('child_changed', add, null, this);

    const remove = ref.on('child_removed', (v) => {
      const key = v.key;
      map.delete(key);
      this.emit(key);
    });

    this.on('destroy', () => {
      ref.off('child_added', add);
      ref.off('child_changed', add);
      ref.off('child_removed', remove);
    });
  }
}

module.exports = Config;
