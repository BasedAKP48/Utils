const { EventEmitter } = require('events');
const ensureRequired = require('./ensureRequired');
const getSafeObject = require('./safeFirebaseObject');
const admin = require('firebase-admin');

const initialConn = {};

const requiredOptions = [
  'rootRef',
  'cid',
  'pkg',
];

class PresenceSystem extends EventEmitter {
  initialize(options) {
    if (!ensureRequired(options, requiredOptions)) {
      throw new Error('Missing required options!'); // TODO: say which options
    }

    const {
      cid, rootRef, instanceName, listenMode, pkg,
    } = options;

    const registryRef = rootRef.child('pluginRegistry').child(cid);
    const presenceRef = registryRef.child('presence');

    rootRef.child('.info/connected').on('value', (snapshot) => {
      if (snapshot.val() === true) {
        this.emit('connect');
        initialConn.main = true;

        // on connect, set registryRef with information about the plugin
        registryRef.update({
          info: {
            pluginName: pkg.name,
            pluginVersion: pkg.version,
            pluginDepends: getSafeObject(pkg.dependencies),
            instanceName: instanceName || pkg.name,
            listenMode: listenMode || 'normal',
          },
        });

        // on connect, set presenceRef to connected status
        presenceRef.update({ connected: true, lastConnect: admin.database.ServerValue.TIMESTAMP });
        // on disconnect, set presenceRef to disconnected status
        presenceRef.onDisconnect().update({
          connected: false,
          lastDisconnect: admin.database.ServerValue.TIMESTAMP,
        });
      } else if (initialConn.main === true) {
        this.emit('disconnect');
      }
    });

    /* without the initialConn || snapshot.val() checks below, the initial 'null' value from
    firebase can result in sending an extraneous 'online' status. */
    presenceRef.child('status').on('value', (snapshot) => {
      if (initialConn.status || snapshot.val()) {
        this.emit('status', snapshot.val() || 'online');
      }

      initialConn.status = true;
    });
  }
}

module.exports = PresenceSystem;
