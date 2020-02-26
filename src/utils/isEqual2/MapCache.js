import {
  DATA,
  getMapData,
} from './shared';
import Hash from './Hash';
import ListCache from './ListCache';

const MapCache = function(entries) {
  let index = -1;
  const length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    const entry = entries[index];
    this.set(entry[0], entry[1]);
  }
};

const mapCacheClear = function() {
  this[DATA] = {
    hash: new Hash,
    map: new (Map || ListCache),
    string: new Hash
  };
};

const mapCacheDelete = function(key) {
  return getMapData(this, key).delete(key);
};

const mapCacheGet = function(key) {
  return getMapData(this, key).get(key);
};

const mapCacheHas = function(key) {
  return getMapData(this, key).has(key);
};

const mapCacheSet = function(key, value) {
  getMapData(this, key).set(key, value);
  return this;
};

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype.delete = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

export default MapCache;