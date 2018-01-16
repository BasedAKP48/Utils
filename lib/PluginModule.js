const path = require('path');
const EventEmitter = require('events');
const getCID = require('./getCID');
const initialize = require('./initialize');
const Presence = require('./presenceSystem');
const Message = require('./messagingSystem');

const modules = [];

class Module extends EventEmitter {
  /**
   * @param {Object} options
   * @param {String} options.type
   * @param {String} [options.name] Name of module
   * @param {Firebase.DatabaseReference} [options.root]
   * @param {Object} [options.serviceAccount] path to serviceAccount.json
   * @param {String} [options.cid] CID to use, or random if cidPath is not provided.
   * @param {String} [options.cidPath] Path to read CID from if CID is not provided.
   * @param {Object} [options.pkg=./package.json]
   * @param {String} [options.listenMode=normal]
   */
  constructor(options) {
    let { serviceAccount } = options;
    if (!options.root && !serviceAccount) {
      const serviceFile = path.resolve(path.dirname(require.main.filename), 'serviceAccount.json');
      if (!serviceFile) throw new Error('No serviceAccount provided, and none could be found.');
      serviceAccount = require.main.require(serviceFile);
    }
    if (!options.type) throw new Error('options.type is required!');

    super();

    modules.push(this);

    this.root = options.root;
    if (!this.root) {
      const admin = require.main.require('firebase-admin');
      initialize(admin, serviceAccount);
      this.root = admin.database().ref();
    }

    const temp = !options.cid && !options.cidPath;

    this.type = options.type;
    this.cid = options.cid || getCID(this.root, options.cidPath);
    this.pkg = options.pkg || require.main.require('./package.json');
    this.listenMode = options.listenMode || 'normal';
    this.name = options.name;

    let destroyed = false;
    this.destroyed = () => destroyed;
    this.on('destroy', () => {
      if (destroyed) return;

      if (this.message) {
        // Shutdown messages
        this.message.clearListeners();
        if (temp) {
          this.message.remove();
        }
        delete this.message;
      }
      if (this.presence) {
        // Shutdown presence
        this.presence.clearListeners();
        if (temp) {
          this.presence.remove();
        }
        delete this.presence;
      }

      destroyed = true;
    });
  }

  presenceSystem() {
    if (this.destroyed()) throw new Error('');

    if (!this.presence) {
      this.presence = Presence();
      const {
        cid, pkg, root, name,
      } = this;
      this.presence.initialize({
        cid, pkg, rootRef: root, instanceName: name,
      });
    }
    return this.presence;
  }

  messageSystem() {
    if (this.destroyed()) throw new Error('');

    if (!this.message) {
      this.message = Message();
      const { cid, listenMode, root } = this;
      this.message.initialize({ cid, listenMode, rootRef: root });
    }
    return this.message;
  }
}

process.on('SIGINT', () => {
  modules.forEach((m) => {
    m.emit('destroy');
  });
  process.exit(); // exit from program
});

module.exports = Module;
