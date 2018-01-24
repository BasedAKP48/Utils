const { EventEmitter } = require('events');
const ensureRequired = require('./ensureRequired');
const get = require('./safeFirebaseObject');
const admin = require('firebase-admin');

const requiredOptions = [
  'cid',
  'pkg',
  'rootRef',
];

const PresenceSystem = () => {
  const init = {};
  let registryRef;
  const presenceSystem = {
    initialize(options) {
      if (init.self) return;

      if (!ensureRequired(options, requiredOptions)) {
        throw new Error('Missing required options!'); // TODO: say which options
      }

      const {
        cid, pkg, rootRef,
      } = options;

      const instanceName = options.instanceName || pkg.name;
      const listenMode = options.listenMode || 'normal';

      registryRef = rootRef.child('registry').child(get.safeString(cid));
      const presenceRef = registryRef.child('presence');

      rootRef.child('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === true) {
          this.emit('connect');
          init.main = true;

          // on connect, set registryRef with information about the plugin
          registryRef.update({
            info: {
              instanceName,
              listenMode,
              pluginName: pkg.name,
              pluginVersion: pkg.version,
              pluginDepends: get.safeObject(pkg.dependencies),
            },
          });

          // on connect, set presenceRef to connected status
          presenceRef.update({
            connected: true,
            lastConnect: admin.database.ServerValue.TIMESTAMP,
          });

          // on disconnect, set presenceRef to disconnected status
          presenceRef.onDisconnect().update({
            connected: false,
            lastDisconnect: admin.database.ServerValue.TIMESTAMP,
          });
        } else if (init.main) {
          this.emit('disconnect');
        }
      });

      /* without the initialConn || snapshot.val() checks below, the initial 'null' value from
      firebase can result in sending an extraneous 'online' status. */
      presenceRef.child('status').on('value', (snapshot) => {
        if (init.status || snapshot.val()) {
          this.emit('status', snapshot.val() || 'online');
        }

        init.status = true;
      });

      init.self = true;
    },
    clearListeners() {
      // TODO
    },
    remove() {
      registryRef.remove();
    },
    valid() {
      return !!registryRef;
    },
  };

  EventEmitter.call(presenceSystem);
  Object.assign(presenceSystem, EventEmitter.prototype);
  return presenceSystem;
};

module.exports = PresenceSystem;
