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
    /**
     * Initializes the Messaging System.
     * @param {Object} options - The options to use for initialization.
     * @param {Firebase.DatabaseReference} options.rootRef
     * @param {string} [options.cid] - The client ID to use.
     * @param {string} [options.listenMode=normal] - The mode to listen in.
     * @param {boolean} [options.deleteAfterEmit=false] - Whether to delete messages after emitting.
     */
    initialize(options) {
      if (init.self) return;

      if (!ensureRequired(options, requiredOptions)) {
        throw new Error('Missing required options!'); // TODO: say which options
      }

      const {
        rootRef,
      } = options;

      ({ cid } = options.cid);
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
            this.emit('self-sent-msg', msg, message.ref);
            return;
          }
          this.emit('message', msg, message.ref);
          this.emit(`message/${msg.type}`, msg, message.ref);
        });
      }

      // Emits a message when it's directed to this plugins CID.
      clientMsgRef.on('child_added', (msg) => {
        this.emit('message', msg.val(), msg.ref);
        this.emit(`message/${msg.val().type}`, msg.val(), msg.ref);

        if (deleteAfterEmit) {
          msg.ref.remove();
        }
      });

      init.self = true;
    },

    /**
     * Reply to a message with simple text.
     * @param {string} text - The text to send.
     * @param {Message} msg - The message to reply to.
     */
    sendText(text, msg) {
      if (!text || !msg) {
        throw new Error('Cannot send text without both parameters!');
      }
      const reply = getReply(msg, cid, text);
      return outgoingMsgRef.push(reply);
    },

    /**
     * Send a message. The message provided is expected to be a full reply, such as one provided by
     * `Utils.getReply()`.
     * @param {Message} msg - The message to send.
     */
    sendMessage(msg) {
      if (!msg) {
        throw new Error('No message provided!');
      }
      return outgoingMsgRef.push(msg);
    },
  };

  EventEmitter.call(messagingSystem);
  Object.assign(messagingSystem, EventEmitter.prototype);
  return messagingSystem;
};

module.exports = MessagingSystem;
