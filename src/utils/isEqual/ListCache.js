import {
  DATA,
} from '../../consts';
import eq from './eq';

export const splice = Array.prototype.splice;

const assocIndexOf = (array, key) => {
  let length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
};

const ListCache = function(entries) {
  let index = -1;
  const length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    const entry = entries[index];
    this.set(entry[0], entry[1]);
  }
};

ListCache.prototype = {
  clear() {
    this[DATA] = [];
  },

  delete(key) {
    const data = this[DATA];
    const index = assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    const lastIndex = data.length - 1;
    if (index === lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    return true;
  },

  get(key) {
    const data = this[DATA];
    const index = assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  },

  has(key) {
    return assocIndexOf(this[DATA], key) > -1;
  },

  set(key, value) {
    const data = this[DATA];
    const index = assocIndexOf(data, key);

    if (index < 0) {
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  },
};

export default ListCache;