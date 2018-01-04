const { EventEmitter } = require('events');
const ensureRequired = require('./ensureRequired');
const get = require('./safeFirebaseObject');
const getCID = require('./getCID');
const admin = require('firebase-admin');

const initialConn = {};

const requiredOptions = [
  'rootRef',
  'pkg',
];

class PresenceSystem extends EventEmitter {
  initialize(options) {
    if (!ensureRequired(options, requiredOptions)) {
      throw new Error('Missing required options!'); // TODO: say which options
    }

    const {
      rootRef, pkg,
    } = options;

    const cid = options.cid || getCID(rootRef);
    const instanceName = options.instanceName || pkg.name;
    const listenMode = options.listenMode || 'normal';

    const registryRef = rootRef.child('pluginRegistry').child(get.safeString(cid));
    const presenceRef = registryRef.child('presence');

    rootRef.child('.info/connected').on('value', (snapshot) => {
      if (snapshot.val() === true) {
        this.emit('connect');
        initialConn.main = true;

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

    // Emits a message when it's directed to this plugins CID.
    rootRef.child('clients').child(get.safeString(cid)).on(
      'child_added',
      message => this.emit('message', message.val(), message.ref),
    );
  }
}

module.exports = PresenceSystem;
