import StoreError from './StoreError';
import query from './query';
import update from './update';
import {
  get,
  exists,
  clone,
} from './utils';
import {
  isArray,
  isFunction,
  isObjectLike,
  isProjection,
  isNumber,
  isObject,
} from './types';

const watchGet = function() {
  const value = this.selector();
  return isProjection(value) ? this.cursor.projection(value) : this.cursor.get(value);
};

const Cursor = function(proxy, lock, emitter, path) {
  this.path = path !== undefined ? query.coerce(path) : [];
  this.hash = this.path !== undefined ? query.hash(this.path) : '';
  this.emitter = emitter;
  this.lock = lock;
  this.data = proxy;
};

Cursor.prototype = {
  onChange(fn) {
    return this.emitter.add(fn, this.hash, this.data);
  },

  select(value) {
    const {
      emitter,
      path,
      data,
      lock,
    } = this;

    const selector = query.coerce(value);
    if (query.isDynamic(selector)) throw new StoreError(`select does not support dynamic paths`, { path: value });
    
    // eslint-disable-next-line no-use-before-define
    const cursor = new Cursor(get(data, selector), lock, emitter, [...path, ...selector]);
    
    return cursor;
  },

  watch(listener, fn) {
    const selector = isFunction(listener) ? listener : () => listener;

    const disposer = this.emitter.add(fn, this.hash, this.data, selector);

    disposer.get = watchGet;
    disposer.cursor = this;

    return disposer;
  },

  projection(path) {
    if (!isObjectLike(path)) throw new StoreError(`projection requires an object`, { value: path });
    if (isArray(path)) return this.get(path);
    const { data, lock } = this;
    
    lock.lock();
    const result = Object.fromEntries(
      Object.entries(path)
        .map(([key, value]) => {
          return [key, query.get(data, value)];
        })
    );
    lock.unlock();

    return result;
  },

  get(path) {
    const { data, lock } = this;
    if (!path) return data;
    
    lock.lock();
    const result = query.get(data, path);
    lock.unlock();
    
    return result;
  },

  exists(path) {
    if (path === undefined) return this.data !== undefined;
    return exists(this.data, query.coerce(path));
  },

  clone(path) {
    if (path === undefined) return clone(this.data);
    return clone(this.get(path));
  },

  toJSON() {
    const { data, lock } = this;

    lock.lock();
    const json = JSON.stringify(data);
    lock.unlock();

    return json;
  },
};

const makeSetter = function(name, arity, typeChecker) {
  Cursor.prototype[name] = function(pth, val) {
    const length = arguments.length;

    let path = pth;
    let value = val;

    // we should warn the user if he applies to many arguments to the function
    if (length > arity) throw new StoreError(`${name}: too many arguments`);

    // handling arities
    if (arity === 2 && length === 1) {
      value = path;
      path = [];
    }

    // coerce path
    path = path === undefined ? [] : query.coerce(path);

    // checking the value's validity
    if (typeChecker && !typeChecker(value)) throw new StoreError(`${name}: invalid value`, { path, value });

    const solvedPath = path.length ? query.solve(this.data, path) : path;
    if (path.length !== solvedPath.length) throw new StoreError(`${name}: invalid path`, { path, value });

    // don't unset irrelevant paths
    if (name === 'unset') {
      if (!solvedPath.length) return (this.data = undefined);
      if (!this.exists(solvedPath)) return;
    }

    // applying the update
    return update(
      this.data,
      solvedPath,
      name,
      value,
    );
  };
};

makeSetter('set', 2);
makeSetter('unset', 1);
makeSetter('push', 2);
makeSetter('concat', 2, isArray);
makeSetter('unshift', 2);
makeSetter('pop', 1);
makeSetter('shift', 1);
makeSetter('splice', 2, function(target) {
  if (!isArray(target) || target.length < 1) return false;
  if (target.length > 1 && isNaN(+target[1])) return false;
  return isNumber(target[0]) || isFunction(target[0]) || isObject(target[0]);
});
makeSetter('merge', 2, isObject);

export default Cursor;