const root = require('./root')();

root.child('messages').remove().then(() => {
  console.log('Messages cleared.');
  process.exit();
});
