/**
 * Initializes a FirebaseAdmin application.
 * @param {FirebaseAdmin} firebase - Firebase package
 * @param {string|Object} serviceAccount - Service Account file from the firebase web application
 * @param {string} [appname] - Optional name to initialize with.
 */
module.exports = (firebase, serviceAccount, appname) => {
  if (firebase.apps.length) return; // TODO: Check if provided appname is loaded
  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  }, appname);
};
