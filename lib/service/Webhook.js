const EventEmitter = require('events');
const M = require('../plugin/Module');
const hasRequired = require('../ensureRequired');
const { isUnsafe } = require('../safeFirebaseObject');

class Webhook extends EventEmitter {
  constructor(options) {
    if (!hasRequired(options, ['root', 'cid'])) throw new Error('Missing options');
    super();
    if (options instanceof M) {
      /** @type {M} */
      this.emitter = options;
      options.on('destroy', () => this.emit('destroy'));
    }

    this.root = options.root;
    this.cid = options.cid;

    this.webhooks = {
      // path: reference
    };
    this.on('destroy', () => {
      Object.keys(this.webhooks).forEach((key) => {
        this.emit(`destroy/${key}`);
        delete this.webhooks[key];
      }, this);
    });
  }

  get keys() {
    return Object.keys(this.webhooks);
  }

  /**
   * @param {String} [token]
   * @returns {String|Boolean} token that was registered (or provided), false if token is
   * already registered.
   */
  register(token) {
    if (token && isUnsafe(token, true)) {
      throw new Error('Token contains unsafe characters');
    }
    const ref = getTokenRef(this, token);
    const { path } = ref;
    if (this.webhooks[path]) return false;
    this.webhooks[path] = register(this, ref);
    return path;
  }

  remove(token) {
    if (!token) throw new Error('Attempted to remove empty token');
    if (this.webhooks[token]) {
      this.emit(`destroy/${token}`);
    }
    return delete this.webhooks[token];
  }
}

/**
 * @param {Webhook} instance
 */
function register(instance, { ref, path }) {
  const cidRef = ref.child(instance.cid);
  cidRef.update({ keepalive: true });
  const keyListener = cidRef.child('hooks').on('child_added', snap =>
    instance.root.child(`webhooks/data/${snap.key}`).once('value')
      .then(hook => new Promise((res) => {
        // No data on this key, stale key?
        if (!hook.exists()) return res();
        // If data doesn't exist anymore, resolve early
        const dataDeleted = hook.ref.on('value', (deleted) => {
          if (deleted.exists()) return;
          hook.ref.off('value', dataDeleted);
          res();
        });
        // Emit 'webhook' event
        const data = hook.val();
        data.sendStatus = res;
        emit(instance, path, data);
        return null;
      }).then((status) => {
        // Remove the key from our listener
        snap.remove();
        if (!status) return;
        // Set status if provided
        hook.ref.child('status').set(status);
      })));
  // Remove when we're destroyed
  instance.once(`destroy/${path}`, () => {
    cidRef.child('hooks').off('child_added', keyListener);
    cidRef.remove();
  });
  return cidRef;
}

/**
 * @param {Webhook} instance
 * @param {String} token
 */
function getTokenRef(instance, token) {
  const ref = instance.root.child('webhooks/tokens');
  const ret = token ? ref.child(token) : ref.push();
  return { ref: ret, path: token || ref.key };
}
/**
 * @param {Webhook} instance
 */
function emit(instance, path, data) {
  if (instance.emitter) {
    instance.emitter.emit(`webhook/${path}`, data);
  }
  instance.emit(path, data);
}

module.exports = Webhook;
