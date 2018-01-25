const { EventEmitter } = require('events');
const ensureRequired = require('./ensureRequired');
const get = require('./safeFirebaseObject');
const getReply = require('./getReply');

const requiredOptions = [
  'cid',
  'rootRef',
];

const MessagingSystem = () => {
  const init = {};
  let cid;
  let clientMsgRef;
  let globalMsgRef;
  let outgoingMsgRef;
  const messagingSystem = {
    initialize(options) {
      if (init.self) return;

      if (!ensureRequired(options, requiredOptions)) {
        throw new Error('Missing required options!'); // TODO: say which options
      }

      const {
        rootRef,
      } = options;

      cid = options.cid;
      const listenMode = options.listenMode || 'normal';
      const deleteAfterEmit = options.deleteAfterEmit || false;
      clientMsgRef = rootRef.child('clients').child(get.safeString(cid));
      globalMsgRef = rootRef.child('messages').orderByChild('timeReceived').startAt(Date.now());
      outgoingMsgRef = rootRef.child('pendingMessages');

      // Emits messages from the general queue
      if (listenMode === 'normal') {
        globalMsgRef.on('child_added', (message) => {
          const msg = message.val();
          // Emit a special event for messages from this plugin
          if (msg.uid === cid) {
            this.emit('message-self', msg, message.ref);
            return;
          }
          ['message', `message-${msg.direction}`, `message/${msg.type.toLowerCase()}`]
            .forEach(type => this.emit(type, msg, message.ref), this);
        });
      }

      // Emits a message when it's directed to this plugins CID.
      clientMsgRef.on('child_added', (msg) => {
        ['message', `message-${msg.direction}`, `message/${msg.val().type.toLowerCase()}`]
          .forEach(type => this.emit(type, msg.val(), msg.ref), this);

        if (deleteAfterEmit) {
          msg.ref.remove();
        }
      });

      init.self = true;
    },


    sendText(text, msg, data) {
      if (!text || !msg) {
        throw new Error('Cannot send text without both parameters!');
      }
      const reply = getReply(msg, cid, text, data);
      return this.sendMessage(reply);
    },

    sendMessage(msg) {
      if (!msg) {
        throw new Error('No message provided!');
      }
      if (msg.uid !== cid) {
        msg.uid = cid;
      }
      return outgoingMsgRef.push(msg);
    },
    clearListeners() {
      // TODO
    },
    remove() {
      // TODO
    },
  };

  EventEmitter.call(messagingSystem);
  Object.assign(messagingSystem, EventEmitter.prototype);
  return messagingSystem;
};

module.exports = MessagingSystem;
