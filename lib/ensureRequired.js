module.exports = (options, required) => options && Array.isArray(required) &&
  !required.map(val => Object.prototype.hasOwnProperty.call(options, val)).includes(false);
