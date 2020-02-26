import {
  DATA,
} from '../../consts';
import {
  isKeyable,
} from './shared';
import Hash from './Hash';

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

MapCache.prototype.clear = function() {
  this[DATA] = {
    hash: new Hash(),
    map: new Map(),
    string: new Hash(),
  };
};

MapCache.prototype.delete = function(key) {
  return getMapData(this, key).delete(key);
};

MapCache.prototype.get = function(key) {
  return getMapData(this, key).get(key);
};

MapCache.prototype.has = function(key) {
  return getMapData(this, key).has(key);
};

MapCache.prototype.set = function(key, value) {
  getMapData(this, key).set(key, value);
  return this;
};

export default MapCache;