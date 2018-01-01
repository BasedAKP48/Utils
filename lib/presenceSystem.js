const ensureRequired = require('./ensureRequired');
const admin = require('firebase-admin');

let initialConn = false;
let requiredOptions = [
  'rootRef',
  'cid',
  'instanceName',
  'listenMode',
  'pkg'
];

module.exports = (options) => {
  if (!ensureRequired(options, requiredOptions)) {
    throw new Error('Missing required options!'); // TODO: say which options
  }

  const { cid, rootRef, instanceName, listenMode, pkg } = options;
  const registryRef = rootRef.child('pluginRegistry').child(cid);
  const presenceRef = registryRef.child('presence');

  rootRef.child('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === true) {
      console.log('connected to Firebase!');
      initialConn = true;
  
      // on connect, set registryRef with information about the plugin
      registryRef.update({
        info: {
          pluginName: pkg.name,
          pluginVersion: pkg.version,
          pluginDepends: pkg.dependencies,
          instanceName: instanceName,
          listenMode: listenMode
        }
      });
  
      // on connect, set presenceRef to connected status
      presenceRef.update({connected: true, lastConnect: admin.database.ServerValue.TIMESTAMP});
      // on disconnect, set presenceRef to disconnected status
      presenceRef.onDisconnect().update({connected: false, lastDisconnect: admin.database.ServerValue.TIMESTAMP});
    } else if (initialConn === true) {
      console.log('disconnected from Firebase!');
    }
  });
}