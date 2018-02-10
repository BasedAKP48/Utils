const ensureRequired = require('./lib/ensureRequired');
const get = require('./lib/safeFirebaseObject');
const getCID = require('./lib/getCID');
const getReply = require('./lib/getReply');
const initialize = require('./lib/initialize');
const MessagingSystem = require('./lib/messagingSystem');
const PresenceSystem = require('./lib/presenceSystem');
const Plugin = require('./lib/plugin/Plugin');
const Connector = require('./lib/plugin/Connector');
const Module = require('./lib/plugin/Module');
const move = require('./lib/move');

module.exports = {
  Plugin,
  Connector,
  Module,
  MessagingSystem,
  PresenceSystem,
  ensureRequired,
  getCID,
  getReply,
  initialize,
  move,
  safeObject: get.safeObject,
  safeString: get.safeString,
  isUnsafe: get.isUnsafe,
};
