import StoreError from './StoreError';
import query from './query';
import { get } from './utils';
import {
  isArray,
  isFunction,
  isObjectLike,
  isProjection,
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

  set(path, value) {
    // TODO: abstract
    // TODO: assumes path is an array
    // TODO: assumes path is static
    const basePath = path.slice(0, path.length - 1);
    const accessor = path[path.length - 1];

    const target = this.get(basePath);
    target[accessor] = value;

    return this;
  },

  unset(path) {
    // TODO: abstract
    // TODO: assumes path is an array
    // TODO: assumes path is static
    const basePath = path.slice(0, path.length - 1);
    const accessor = path[path.length - 1];

    const target = this.get(basePath);
    if (isArray(target)) target.splice(accessor, 1);
    delete target[accessor];

    return this;
  },

  push(path, ...args) {
    // TODO: abstract
    // TODO: assumes path is an array
    // TODO: assumes path is static
    const target = this.get(path);

    if (!isArray(target)) throw new StoreError(`push: target is not an array`, { target });

    target.push(...args);

    return this;
  },

  concat(path, arr) {
    // TODO: abstract
    // TODO: assumes path is an array
    // TODO: assumes path is static
    const basePath = path.slice(0, path.length - 1);
    const accessor = path[path.length - 1];
    const target = basePath[accessor];

    if (!isArray(target)) throw new StoreError(`concat: target is not an array`, { target });

    basePath[accessor] = target.concat(arr);

    return this;
  },

  pop(path) {
    // TODO: abstract
    // TODO: assumes path is an array
    // TODO: assumes path is static
    const basePath = path.slice(0, path.length - 1);
    const accessor = path[path.length - 1];
    const target = basePath[accessor];

    if (!isArray(target)) throw new StoreError(`pop: target is not an array`, { target });

    const popped = target.pop();

    return popped;
  },
  shift(path) {
    // TODO: abstract
    // TODO: assumes path is an array
    // TODO: assumes path is static
    const basePath = path.slice(0, path.length - 1);
    const accessor = path[path.length - 1];
    const target = basePath[accessor];

    if (!isArray(target)) throw new StoreError(`shift: target is not an array`, { target });

    const shifted = target.shift();

    return shifted;
  },
  splice(path, ...args) {
    // TODO: abstract
    // TODO: assumes path is an array
    // TODO: assumes path is static
    const basePath = path.slice(0, path.length - 1);
    const accessor = path[path.length - 1];
    const target = basePath[accessor];

    if (!isArray(target)) throw new StoreError(`splice: target is not an array`, { target });

    const spliced = target.splice(...args);

    return spliced;
  },
  merge(path, value) {
    // TODO: abstract
    // TODO: assumes path is an array
    // TODO: assumes path is static
    const basePath = path.slice(0, path.length - 1);
    const accessor = path[path.length - 1];
    const target = basePath[accessor];

    basePath[accessor] = {
      ...target,
      ...value,
    };

    return this;
  },

  toJSON() {
    const { data, lock } = this;

    lock.lock();
    const json = JSON.stringify(data);
    lock.unlock();

    return json;
  },
};

export default Cursor;