const admin = require('firebase-admin');
const initialize = require('../lib/initialize');
const serviceAccount = require('./serviceAccount.json');

initialize(serviceAccount);
const root = admin.database().ref();

module.exports = (database) => {
  if (!database) return root;
  return admin.database().refFromURL(`https://${database}.firebaseio.com`);
};
