const Connector = require('./lib/plugin/Connector');
const Plugin = require('./lib/plugin/Plugin');
const MessagingSystem = require('./lib/messagingSystem');
const Module = require('./lib/plugin/Module');
const PresenceSystem = require('./lib/presenceSystem');
const args = require('./lib/args');
const commands = require('./lib/commands');
const components = require('./lib/components');
const settings = require('./lib/commandSettings');
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
  allowedHere: settings.allowedHere,
  collectCommands: commands.collect,
  commandGuilds: settings.guildsOf,
  commandSettings: settings.commandSettings,
  buildComponents: components.build,
  componentCustomId: components.customId,
  ensureRequired,
  eventForwarder,
  filterChoices: args.filterChoices,
  getCID,
  getReply,
  initialize,
  move,
  commandUsage: commands.usage,
  isUnsafe: get.isUnsafe,
  parseCommand: commands.parseText,
  parseComponentCustomId: components.parseCustomId,
  safeObject: get.safeObject,
  safeString: get.safeString,
  validateCommands: commands.validate,
  validateComponents: components.validate,
};
