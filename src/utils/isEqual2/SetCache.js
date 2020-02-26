import {
  DATA,
  HASH_UNDEFINED,
} from './shared';
import MapCache from './MapCache';

const SetCache = function(values) {
  let index = -1;
  const length = values ? values.length : 0;

  this[DATA] = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
};

const setCacheAdd = function(value) {
  this[DATA].set(value, HASH_UNDEFINED);
  return this;
};

const setCacheHas = function(value) {
  return this[DATA].has(value);
};

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

export default SetCache;