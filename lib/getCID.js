const path = require('path');

/**
 * Loads or generates a CID for you.
 * @param {admin.database.Reference} root - root reference of your database.
 * @param {string} dir - root directory of your plugin.
 * @param {string} [file=cid.json] - optional file name.
 */
module.exports = (root, dir, file) => {
  file = file || 'cid.json';
  const filepath = `${dir}${path.sep}${file}`;
  let cid;
  try {
    cid = require(filepath);
  } catch (e) {
    cid = root.push().key;
    require('fs').writeFileSync(filepath, JSON.stringify(cid), { encoding: 'UTF-8' });
  }
  return cid;
};
