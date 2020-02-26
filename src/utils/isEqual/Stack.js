import {
  DATA,
} from '../../consts';
import ListCache from './ListCache';

const Stack = function(entries) {
  this[DATA] = new ListCache(entries);
};

Stack.prototype = {
  delete(key) {
    return this[DATA].delete(key);
  },

  get(key) {
    return this[DATA].get(key);
  },

  set(key, value) {
    const cache = this[DATA];
    const pairs = cache[DATA];
    pairs.push([key, value]);
    return this;
  },
};

export default Stack;