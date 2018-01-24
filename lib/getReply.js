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
