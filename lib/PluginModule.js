const path = require('path');
const EventEmitter = require('events');
const hasRequired = require('./ensureRequired');
const getCID = require('./getCID');
const initialize = require('./initialize');
const Presence = require('./presenceSystem');
const Message = require('./messagingSystem');

const modules = [];

class Module extends EventEmitter {
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

    const temp = !options.cid && !(options.cidPath || options.dir);

    this.type = options.type;
    this.cid = options.cid || getCID({
      root: this.root, dir: options.dir, cidPath: options.cidPath, file: options.dirFile,
    });
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

  /**
   * TODO: Move this to type definition
   * @param {Object} msg
   * @param {string} msg.target
   * @param {string} msg.command
   * @param {string} msg.arg
   * @param {Object} [msg.data]
   * @param {Object} [options]
   * @param {Number} [options.timeout=60000] At least 1 second (1000) to deal with latency
   * @returns {Promise<any>} promise called with resolved message data
   */
  response(msg, options = {}) {
    const self = this;
    const timeout = options.timeout >= 1000 ? options.timeout : 60000;

    return new Promise((res, rej) => {
      if (!hasRequired(msg, ['target', 'command', 'arg'])) {
        throw new Error('Missing required arguments');
      }
      const message = {
        uid: self.cid,
        target: msg.target,
        text: msg.command,
        channel: msg.arg,
        data: msg.data,
      };

      self.messageSystem().sendMessage(message);
      const to = setTimeout(() => {
        // Turn off the listener
        clearListener();
        rej(new Error('Response timed out'));
      }, timeout);
      const fn = self.messageSystem().on('message/internal', (reply) => {
        const notSender = message.target !== reply.uid;
        const notCommand = message.text !== reply.text;
        const notArg = message.channel !== reply.channel;
        // Is this the message we're waiting for?
        if (notSender || notCommand || notArg) return;
        // Clear the timeout
        clearTimeout(to);
        // Clear the listener
        clearListener();
        if (reply.data.error) {
          rej(new Error(reply.data.error));
        } else {
          res(reply);
        }
      });

      function clearListener() {
        self.messageSystem().off('message/internal', fn);
      }
    });
  }
}

process.on('SIGINT', () => {
  modules.forEach((m) => {
    m.emit('destroy');
  });
  process.exit(); // exit from program
});

module.exports = Module;
