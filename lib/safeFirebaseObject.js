const blacklist = /[.#$/[\]]/g;

/**
 * Returns a clean object (original or new) ready for storing in firebase.
 * @param {Object} object - Potentially unsafe object.
 * @returns {Object} Original or new clean object.
 */
module.exports = (object) => {
  const illegalKeys = Object.keys(object).filter(key => !!key.match(blacklist));
  if (!illegalKeys.length) return object;

  const ret = Object.assign({}, object);
  illegalKeys.forEach((key) => {
    ret[key.replace(blacklist, '|')] = ret[key];
    delete ret[key];
  });
  return ret;
};
