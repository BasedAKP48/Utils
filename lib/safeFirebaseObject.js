const blacklist = /[.#$/[\]]/g;

/**
 * Returns a cleaned string ready for use in firebase.
 * @param {string} string - potentially unsafe string.
 */
function safeString(string) {
  return string.replace(blacklist, '|');
}

/**
 * Returns a clean object (original or new) ready for storing in firebase.
 * @param {Object} object - Potentially unsafe object.
 * @returns {Object} Original or new clean object.
 */
function safeObject(object) {
  const illegalKeys = Object.keys(object).filter(key => !!key.match(blacklist));
  if (!illegalKeys.length) return object;

  const ret = Object.assign({}, object);
  illegalKeys.forEach((key) => {
    ret[safeString(key)] = ret[key];
    delete ret[key];
  });
  return ret;
}

module.exports = {
  safeObject,
  safeString,
};
