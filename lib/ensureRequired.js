module.exports = (options, required) =>
  !required.map(val => Object.prototype.hasOwnProperty.call(options, val)).includes(false);
