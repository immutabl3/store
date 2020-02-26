import {
  DATA,
} from '../../consts';
import ListCache from './ListCache';

const Stack = function(entries) {
  this[DATA] = new ListCache(entries);
};

Stack.prototype.clear = function() {
  this[DATA] = new ListCache();
};

Stack.prototype.delete = function(key) {
  return this[DATA].delete(key);
};

Stack.prototype.get = function(key) {
  return this[DATA].get(key);
};

Stack.prototype.has = function(key) {
  return this[DATA].has(key);
};

Stack.prototype.set = function(key, value) {
  const cache = this[DATA];
  const pairs = cache[DATA];
  pairs.push([key, value]);
  return this;
};

export default Stack;