module.exports = (from, to, prefix) => {
  const old = from.emit;
  const bound = old.bind(from);
  from.emit = (event, ...args) => {
    const prefixed = prefix ? `${prefix}${event}` : event;
    const ret = to.emit(prefixed, ...args);
    // We fall back to ret, because we MUST call both functions
    return bound(event, ...args) || ret;
  };
  from.emit.undo = () => {
    from.emit = old;
  };
};
