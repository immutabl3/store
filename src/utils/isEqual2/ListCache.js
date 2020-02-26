import {
  DATA,
  splice,
  assocIndexOf,
} from './shared';

const ListCache = function(entries) {
  let index = -1;
  const length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    const entry = entries[index];
    this.set(entry[0], entry[1]);
  }
};

const listCacheClear = function() {
  this[DATA] = [];
};

const listCacheDelete = function(key) {
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
};

const listCacheGet = function(key) {
  const data = this[DATA];
  const index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
};

const listCacheHas = function(key) {
  return assocIndexOf(this[DATA], key) > -1;
};

const listCacheSet = function(key, value) {
  const data = this[DATA];
  const index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
};

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype.delete = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

export default ListCache;