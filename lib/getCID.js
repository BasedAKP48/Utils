const path = require('path');
const { safeString } = require('./safeFirebaseObject');

/**
 * Loads or generates a CID for you.
 * If {@param dir} is null, a key will be generated without any I/O access.
 * @param {Object} options
 * @param {admin.database.Reference} options.root - root reference of your database.
 * @param {string} [options.cidPath] - Required if options.dir is not provided.
 * @param {string|null} [options.dir] - root directory of your plugin.
 * @param {string} [options.file=cid.json] - optional file name.
 */
module.exports = (options) => {
  if (!options.root) throw new Error('root missing');

  if (!options.dir && !options.cidPath) {
    return options.root.push().key;
  }

  let filepath;
  if (options.cidPath) {
    filepath = options.cidPath;
  } else if (options.dir) {
    const file = options.file || 'cid.json';
    filepath = `${options.dir}${path.sep}${file}`;
  } else {
    throw new Error('This is an invalid state');
  }

  let cid;
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    cid = require(filepath);
  } catch (e) {
    cid = options.root.push().key;
    // eslint-disable-next-line global-require
    require('fs').writeFileSync(filepath, JSON.stringify(cid), { encoding: 'UTF-8' });
  }
  return safeString(cid);
};
