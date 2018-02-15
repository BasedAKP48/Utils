const admin = require('firebase-admin');

module.exports = (serviceAccount, appname, firebase = admin) => {
  if (firebase.apps.length) return; // TODO: Check if provided appname is loaded
  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  }, appname);
};
