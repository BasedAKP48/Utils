const clone = value => (value == null ? null : JSON.parse(JSON.stringify(value)));

module.exports = function createFakeRoot(initial = {}) {
  const data = clone(initial) || {};
  const reads = [];
  const listeners = {};

  const keys = path => path.split('/').filter(Boolean);
  const get = path => keys(path).reduce((node, key) => {
    if (node === null || typeof node !== 'object' || node[key] === undefined) return null;
    return node[key];
  }, data);
  const set = (path, value) => {
    const parts = keys(path);
    const last = parts.pop();
    const parent = parts.reduce((node, key) => {
      if (node[key] === null || typeof node[key] !== 'object') node[key] = {};
      return node[key];
    }, data);
    parent[last] = clone(value);
  };

  const ref = path => ({
    path,
    child: sub => ref([path, sub].filter(Boolean).join('/')),
    once: async () => {
      reads.push(path);
      return { val: () => clone(get(path)) };
    },
    on: (event, callback) => {
      listeners[path] = (listeners[path] || []).concat(callback);
    },
    transaction: async (update) => {
      const result = update(clone(get(path)));
      if (result !== undefined) set(path, result);
      return { committed: result !== undefined };
    },
  });

  return {
    root: ref(''),
    data,
    reads,
    get,
    emit: (path, value) => (listeners[path] || [])
      .forEach(callback => callback({ val: () => value })),
  };
};
