const admin = require('firebase-admin');

module.exports = (serviceAccount, appname, firebase = admin) => {
  if (firebase.apps.length) return; // TODO: Check if provided appname is loaded
  const projectId = serviceAccount
    ? serviceAccount.project_id
    : process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error('No serviceAccount provided, and no project could be found (set GOOGLE_CLOUD_PROJECT).');
  }
  firebase.initializeApp({
    credential: serviceAccount
      ? firebase.credential.cert(serviceAccount)
      : firebase.credential.applicationDefault(),
    projectId,
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${projectId}.firebaseio.com`,
  }, appname);
};
