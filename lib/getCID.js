const path = require('path');
const { safeString } = require('./safeFirebaseObject');

/**
 * Loads or generates a CID for you.
 * If {@param dir} is null, a key will be generated without any I/O access.
 * @param {admin.database.Reference} root - root reference of your database.
 * @param {string|null} dir - root directory of your plugin.
 * @param {string} [file=cid.json] - optional file name.
 */
module.exports = (root, dir, file) => {
  if (!dir) {
    return root.push().key;
  }

  file = file || 'cid.json';
  const filepath = `${dir}${path.sep}${file}`;
  let cid;
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    cid = require(filepath);
  } catch (e) {
    cid = root.push().key;
    // eslint-disable-next-line global-require
    require('fs').writeFileSync(filepath, JSON.stringify(cid), { encoding: 'UTF-8' });
  }
  return safeString(cid);
};
