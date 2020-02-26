import {
  DATA,
} from '../../consts';
import Hash from './Hash';

const isKeyable = value => {
  const type = typeof value;
  return (type === 'string' || type === 'number' || type === 'symbol' || type === 'boolean')
    ? (value !== '__proto__')
    : (value === null);
};

const getMapData = (map, key) => {
  const data = map[DATA];
  return isKeyable(key)
    ? data[typeof key === 'string' ? 'string' : 'hash']
    : data.map;
};

const MapCache = function(entries) {
  let index = -1;
  const length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    const entry = entries[index];
    this.set(entry[0], entry[1]);
  }
};

MapCache.prototype = {
  clear() {
    this[DATA] = {
      hash: new Hash(),
      map: new Map(),
      string: new Hash(),
    };
  },

  has(key) {
    return getMapData(this, key).has(key);
  },

  set(key, value) {
    getMapData(this, key).set(key, value);
    return this;
  },
};

export default MapCache;