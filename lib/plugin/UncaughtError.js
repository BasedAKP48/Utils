class UncaughtError extends Error {
  constructor(error) {
    super();
    this.originalError = error;
  }
}

module.exports = UncaughtError;
