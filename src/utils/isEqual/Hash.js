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

Hash.prototype = {
  clear() {
    this[DATA] = Object.create(null);
  },

  delete(key) {
    return this.has(key) && delete this[DATA][key];
  },

  get(key) {
    const data = this[DATA];
    const result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  },

  has(key) {
    const data = this[DATA];
    return data[key] !== undefined;
  },

  set(key, value) {
    const data = this[DATA];
    data[key] = value === undefined ? HASH_UNDEFINED : value;
    return this;
  },
};

export default Hash;