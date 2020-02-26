import {
  DATA,
  HASH_UNDEFINED,
} from '../../consts';
import MapCache from './MapCache';

const SetCache = function(values) {
  let index = -1;
  const length = values ? values.length : 0;

  this[DATA] = new MapCache();
  while (++index < length) {
    this.add(values[index]);
  }
};

SetCache.prototype = {
  add(value) {
    this[DATA].set(value, HASH_UNDEFINED);
    return this;
  },
  has(value) {
    return this[DATA].has(value);
  },
};

export default SetCache;