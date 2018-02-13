const Connector = require('./lib/plugin/Connector');
const Plugin = require('./lib/plugin/Plugin');
const MessagingSystem = require('./lib/messagingSystem');
const Module = require('./lib/plugin/Module');
const PresenceSystem = require('./lib/presenceSystem');
const ensureRequired = require('./lib/ensureRequired');
const eventForwarder = require('./lib/eventForwarder');
const getCID = require('./lib/getCID');
const getReply = require('./lib/getReply');
const initialize = require('./lib/initialize');
const move = require('./lib/move');
const get = require('./lib/safeFirebaseObject');

module.exports = {
  Connector,
  Plugin,
  MessagingSystem,
  Module,
  PresenceSystem,
  ensureRequired,
  eventForwarder,
  getCID,
  getReply,
  initialize,
  move,
  isUnsafe: get.isUnsafe,
  safeObject: get.safeObject,
  safeString: get.safeString,
};
