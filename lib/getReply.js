/**
 * Prepare a new message based off of an existing message.
 *
 * @param {Object<string>} msg - Message to respond to.
 * @param {String} uid - Sender of the message, your plugin identifier (usually)
 * @param {String} [text] - Text to include in reply
 */
module.exports = (msg, uid, text) => {
  // Prep the simple stuff, things that stay the same.
  const reply = {
    uid,
    text,
    channel: msg.channel,
    timeReceived: Date.now(),
    data: Object.assign({}, msg.data),
  };

  if (msg.direction !== 'in') { // We're going in now.
    reply.direction = 'in';
    reply.cid = msg.cid;
  } else { // We're going out now.
    reply.direction = 'out';
    reply.target = msg.cid;
  }

  return reply;
};
