/**
 * Ensures that all keys are included in an options object.
 * @param {Object<any>} options - The options to check for required keys in.
 * @param {Array<string>} required - The keys to check for.
 */
module.exports = (options, required) =>
  !required.map(val => Object.prototype.hasOwnProperty.call(options, val)).includes(false);
