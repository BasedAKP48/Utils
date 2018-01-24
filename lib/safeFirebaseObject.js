const blacklist = /[.#$/[\]]/g;

function safeString(string) {
  return string.replace(blacklist, '|');
}

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
