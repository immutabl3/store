import {
  LARGE_ARRAY_SIZE,
  DATA,
} from './shared';
import ListCache from './ListCache';
import MapCache from './MapCache';

const Stack = function(entries) {
  this[DATA] = new ListCache(entries);
};

const stackClear = function() {
  this[DATA] = new ListCache;
};

const stackDelete = function(key) {
  return this[DATA].delete(key);
};

const stackGet = function(key) {
  return this[DATA].get(key);
};

const stackHas = function(key) {
  return this[DATA].has(key);
};

const stackSet = function(key, value) {
  let cache = this[DATA];
  if (cache instanceof ListCache) {
    const pairs = cache[DATA];
    // TODO: refactor
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      return this;
    }
    cache = this[DATA] = new MapCache(pairs);
  }
  cache.set(key, value);
  return this;
};

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype.delete = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

export default Stack;