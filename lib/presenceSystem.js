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

    /* without the initialConn || snapshot.val() checks below, the initial 'null' values from
    firebase can result in one event overriding the other and making the client ignore the status
    we really want. For example, let's say you have afk: true, offline: null in the database.
    What might happen is the afk value comes in, setting status to afk. Immediately thereafter,
    the offline value comes in, with a value of null, setting status to online. Probably not what
    you wanted. */
    presenceRef.child('status').on('value', (snapshot) => {
      if (initialConn.status || snapshot.val()) {
        this.emit(snapshot.val() || 'online', true);
        this.emit('status', snapshot.val() || 'online');
      } else {
        initialConn.status = true;
      }
    });

    presenceRef.child('afk').on('value', (snapshot) => {
      if (initialConn.afk || snapshot.val() === true) {
        this.emit('afk', snapshot.val());
      } else {
        initialConn.afk = true;
      }
    });

    presenceRef.child('offline').on('value', (snapshot) => {
      if (initialConn.offline || snapshot.val() === true) {
        this.emit('offline', snapshot.val());
      } else {
        initialConn.offline = true;
      }
    });
  }
}

module.exports = PresenceSystem;
