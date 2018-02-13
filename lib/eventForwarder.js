module.exports = (from, to, options) => {
  const old = from.emit;
  const bound = old.bind(from);
  from.emit = (event, ...args) => {
    let ret;
    if (shouldForward(options, event)) {
      const prefix = (options && options.prefix) || options;
      const prefixed = prefix ? `${prefix}${event}` : event;
      ret = to.emit(prefixed, ...args);
    } else {
      ret = false;
    }
    // We fall back to ret, because we MUST call both functions
    return bound(event, ...args) || ret;
  };
  from.emit.undo = () => {
    from.emit = old;
  };
};

function shouldForward(options, event) {
  if (Array.isArray(options)) {
    return !has(options, event);
  }
  return !options || typeof options === 'string' || !has(options.except, event);
}

function has(from, val) {
  if (!from) return false;
  if (Array.isArray(from)) {
    return from.indexOf(val) > -1;
  }
  return from === val;
}
