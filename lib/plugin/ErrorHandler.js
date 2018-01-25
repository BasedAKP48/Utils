module.exports = (modules, error) => {
  const timestamp = Date.now();
  const list = modules.filter(module => !module.destroyed() && module.connected);
  return new Promise((res) => {
    if (!list.length) {
      res(false);
      return;
    }
    list.reverse();
    function eat() {
      const m = list.pop();
      if (!m) {
        res(false);
        return;
      }
      m.sendError(error, timestamp).then((val) => {
        if (val) {
          res(true);
        } else {
          eat();
        }
      });
    }
    eat();
  });
};
