import {
  DATA,
  HASH_UNDEFINED,
} from '../../consts';

const Hash = function(entries) {
  let index = -1;
  const length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    const entry = entries[index];
    this.set(entry[0], entry[1]);
  }
};

Hash.prototype.clear = function() {
  this[DATA] = Object.create(null);
};

Hash.prototype.delete = function(key) {
  return this.has(key) && delete this[DATA][key];
};

Hash.prototype.get = function(key) {
  const data = this[DATA];
  const result = data[key];
  return result === HASH_UNDEFINED ? undefined : result;
};

Hash.prototype.has = function(key) {
  const data = this[DATA];
  return data[key] !== undefined;
};

Hash.prototype.set = function(key, value) {
  const data = this[DATA];
  data[key] = value === undefined ? HASH_UNDEFINED : value;
  return this;
};

export default Hash;