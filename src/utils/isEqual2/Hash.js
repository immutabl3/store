import {
  DATA,
  HASH_UNDEFINED,
} from './shared';

const Hash = function(entries) {
  let index = -1;
  const length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    const entry = entries[index];
    this.set(entry[0], entry[1]);
  }
};

const hashClear = function() {
  this[DATA] = Object.create(null);
};

const hashDelete = function(key) {
  return this.has(key) && delete this[DATA][key];
};

const hashGet = function(key) {
  const data = this[DATA];
  const result = data[key];
  return result === HASH_UNDEFINED ? undefined : result;
};

const hashHas = function(key) {
  const data = this[DATA];
  return data[key] !== undefined;
};

const hashSet = function(key, value) {
  const data = this[DATA];
  data[key] = value === undefined ? HASH_UNDEFINED : value;
  return this;
};

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype.delete = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

export default Hash;