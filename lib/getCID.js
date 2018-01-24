const path = require('path');
const { safeString } = require('./safeFirebaseObject');

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
