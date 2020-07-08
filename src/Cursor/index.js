import StoreError from '../StoreError';
import query from '../query';
import makeMethod from './makeMethod';
import getableDisposer from './getableDisposer';
import methodDefinitions from './methodDefinitions';
import {
  get,
  exists,
  clone,
} from '../utils';
import {
  isArray,
  isFunction,
  isObjectLike,
} from '../types';

export default function Cursor(root, locker, emitter, basePath = []) {
  const hash = query.hash(basePath);
  const isRoot = !basePath.length;

  const lockable = function(fn) {
    return function(arg) {
      // start by locking
      locker.lock();
      try {
        // call the function in the try
        return fn(arg);
        // no catch. if there's an err, let it bubble
      } finally {
        // will always unlock, even if there was an error
        // and even though we're returning above
        locker.unlock();
      }
    };
  };

  const api = {
    get data() {
      return get(root, basePath);
    },

    onChange(fn) {
      return emitter.add(fn, hash);
    },

    select(value) {
      const selector = query.coerce(value);
      if (query.isDynamic(selector)) throw new StoreError(`select does not support dynamic paths`, { path: value });
      return Cursor(root, locker, emitter, [...basePath, ...selector]);
    },

    watch(listener, fn) {
      const selector = isFunction(listener) ? listener : () => listener;

      return getableDisposer(
        api,
        emitter.add(fn, hash, selector)
      );
    },

    projection: lockable(path => {
      if (!isObjectLike(path)) throw new StoreError(`projection requires an object`, { value: path });
      if (isArray(path)) return api.get(path);
      
      const result = Object.fromEntries(
        Object.entries(path)
          .map(([key, value]) => {
            return [key, query.get(api.data, value)];
          })
      );

      return result;
    }),

    get: lockable(path => {
      if (!path) return api.data;
      const result = query.get(api.data, path);
      return result;
    }),

    exists(path) {
      if (path === undefined) return api.data !== undefined;
      return exists(api.data, query.coerce(path));
    },

    clone(path) {
      if (path === undefined) return clone(api.data);
      return clone(api.get(path));
    },

    toJSON: lockable(() => {
      return JSON.stringify(api.data);
    }),
  };

  methodDefinitions.forEach(([name, arity, check]) => (
    makeMethod(api, root, basePath, isRoot, name, arity, check)
  ));
  
  return api;
};