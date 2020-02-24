export default class StoreError extends Error {
  constructor(message, obj = {}) {
    super(`store: ${message}`);
    Error.captureStackTrace(this, StoreError);

    this.message = `store: ${message}`;
    this.name = 'StoreError';

    Object.assign(this, obj);
  }
};