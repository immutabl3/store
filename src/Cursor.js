import StoreError from './StoreError';
import query from './query';
import { get } from './utils';
import {
  isArray,
  isFunction,
  isObjectLike,
  isProjection,
} from './types';

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
    
    lock.lock();
    // eslint-disable-next-line no-use-before-define
    const cursor = new Cursor(get(data, selector), lock, emitter, [...path, ...selector]);
    lock.unlock();
    
    return cursor;
  },

  watch(listener, fn) {
    const selector = isFunction(listener) ? listener : () => listener;

    const disposer = this.emitter.add(fn, this.hash, this.data, selector);

    disposer.get = () => {
      const value = selector();
      return isProjection(value) ? this.projection(value) : this.get(value);
    };

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

  get(value) {
    const { data, lock } = this;
    if (!value) return data;
    
    lock.lock();
    const result = query.get(data, value);
    lock.unlock();
    
    return result;
  },
};

export default Cursor;