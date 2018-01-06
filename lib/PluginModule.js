const path = require('path');
const EventEmitter = require('events');
const getCID = require('./getCID');
const initialize = require('./initialize');
const Presence = require('./presenceSystem');
const Message = require('./messagingSystem');

const modules = [];

class Module extends EventEmitter {
  /**
   * 
   * @param {*} options 
   */
  constructor(options = {}) {
    let { serviceAccount } = options;
    if (!options.root && !serviceAccount) {
      const serviceFile = path.resolve(path.dirname(require.main.filename), 'serviceAccount.json');
      if (!serviceFile) throw new Error('No serviceAccount provided, and none could be found.');
      serviceAccount = require.main.require(serviceFile);
    }
    if (!options.type) throw new Error('options.type is required!');

    super(options);

    modules.push(this);

    this.root = options.root;
    if (!this.root) {
      const admin = require.main.require('firebase-admin');
      initialize(admin, serviceAccount);
      this.root = admin.database().ref();
    }

    const temp = !options.cid && !options.cidPathh;

    this.type = options.type;
    this.cidPath = options.cidPath;
    this.cid = options.cid || getCID(this.root, this.cidPath);
    this.pkg = options.pkg || require.main.require('./package.json');
    this.listenMode = options.listenMode || 'normal';
    this.name = options.name;

    this.on('destroy', () => {
      if (this.messageSystem) {
        // Shutdown messages
        if (temp) {
          // Remove remaining references
        }
      }
      if (this.presenceSystem) {
        // Shutdown presence
        if (temp) {
          // Remove reference
        }
      }
    });
  }

  presenceSystem() {
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
    if (!this.message) {
      this.message = Message();
      const { cid, listenMode, root } = this;
      this.message.initialize({ cid, listenMode, rootRef: root });
    }
    return this.message;
  }

  destroy() {
    this.emit('destroy');
  }
}

module.exports = Module;
