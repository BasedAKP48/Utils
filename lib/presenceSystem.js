const { EventEmitter } = require('events');
const ensureRequired = require('./ensureRequired');
const admin = require('firebase-admin');

let initialConn = {
  main: false,
  afk: false,
  offline: false,
};

const requiredOptions = [
  'rootRef',
  'cid',
  'pkg'
];

class PresenceSystem extends EventEmitter {
  constructor() {
    super();
  }

  initialize(options) {
    if (!ensureRequired(options, requiredOptions)) {
      throw new Error('Missing required options!'); // TODO: say which options
    }
  
    const { cid, rootRef, instanceName, listenMode, pkg } = options;
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
            pluginDepends: pkg.dependencies,
            instanceName: instanceName || pkg.name,
            listenMode: listenMode || 'normal'
          }
        });
    
        // on connect, set presenceRef to connected status
        presenceRef.update({connected: true, lastConnect: admin.database.ServerValue.TIMESTAMP});
        // on disconnect, set presenceRef to disconnected status
        presenceRef.onDisconnect().update({connected: false, lastDisconnect: admin.database.ServerValue.TIMESTAMP});
      } else if (initialConn.main === true) {
        this.emit('disconnect');
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
