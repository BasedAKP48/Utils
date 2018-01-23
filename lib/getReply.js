/**
 * Prepare a new message based off of an existing message.
 *
 * @param {Object<string>} msg - Message to respond to.
 * @param {String} uid - Sender of the message, your plugin identifier (usually)
 * @param {String} text - Text to include in reply
 * @param {Object<string>} [data] - data to include in reply
 */
module.exports = (msg, uid, text, data) => {
  // Prep the simple stuff, things that stay the same.
  const reply = {
    uid,
    text,
    channel: msg.channel,
    timeReceived: Date.now(),
    data: Object.assign({}, msg.data, data),
  };

  if (msg.direction === 'out') { // We're replying to a plugin
    reply.target = msg.uid;
  } else { // We're replying to an incoming message
    reply.target = msg.cid;
  }

  return reply;
};
