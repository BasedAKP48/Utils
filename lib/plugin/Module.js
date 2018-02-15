const admin = require('firebase-admin');
const path = require('path');
const EventEmitter = require('events');
const hasRequired = require('../ensureRequired');
const getCID = require('../getCID');
const initialize = require('../initialize');
const Presence = require('../presenceSystem');
const Message = require('../messagingSystem');
const UncaughtError = require('./UncaughtError');
const handleError = require('./ErrorHandler');

/**
 * @type {Module[]}
 */
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

    this.root = options.root;
    if (!this.root) {
      initialize(serviceAccount);
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
      destroyed = true;

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
    });

    this.connected = false;
    this.root.child('.info/connected').on('value', (snap) => {
      this.connected = snap.val();
    });

    // Configuration event
    this.root.child(`config/${this.cid}`).on('value', (d) => {
      this.emit('config', d.val(), d.ref);
    });

    modules.push(this);
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
        type: 'AKPacket',
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

  /**
   * Attempts to send an error to the database.
   * @param {Error} error
   * @param {number} [timestamp]
   */
  sendError(error, timestamp = Date.now()) {
    return new Promise((res) => {
      if (this.destroyed() || !this.connected) {
        res(false);
        return;
      }
      const message = {
        timestamp,
        exitCode: process.exitCode, // undefined normally
        env: {
          os: process.platform,
          engine: 'node',
          version: process.version,
        },
      };

      // We're exiting (probably), lets set how long we've been running.
      if (message.exitCode) {
        message.env.uptime = Math.floor(process.uptime());
      }

      if (error instanceof UncaughtError) {
        message.uncaught = true;
        error = error.originalError;
      }

      if (error instanceof Error) {
        message.error = {
          type: error.name,
          reason: error.message,
          stack: error.stack.split('\n    '),
        };
      } else {
        message.error = {
          type: typeof error,
          reason: error,
        };
      }

      this.root.child(`errors/${this.cid}`).push(message)
        .then(() => { res(true); });
    });
  }
}

// TODO: Handle 'unhandledRejection', 'warning' (maybe?)
process.on('uncaughtException', (err) => {
  handleError(modules, new UncaughtError(err)).then((sent) => {
    if (!sent) {
      console.error('Uncaught Exception:\n', err);
    }
    process.exit();
  });
});

// Exit gracefully on SIGINT
process.on('SIGINT', () => process.exit());

process.on('exit', (code) => {
  // Destroy modules
  modules.forEach(m => m.emit('destroy'));
});

module.exports = Module;
