import StoreError from '../StoreError';
import makeMethod from './makeMethod';
import methodDefinitions from './methodDefinitions';
import {
  get,
  coerce,
} from '../query';
import {
  exists,
  clone,
} from '../utils';
import {
  isArray,
  isFunction,
  isObjectLike,
  isProjection,
} from '../types';

const expandProjection = (projection, basePath) => {
  const target = Object.create(null);
  for (const key in projection) {
    target[key] = basePath.concat(coerce(projection[key]));
  }
  return target;
};

export default function Cursor(root, locker, emitter, basePath = []) {
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

    select(value) {
      const selector = coerce(value);
      return Cursor(root, locker, emitter, [...basePath, ...selector]);
    },

    watch(listener, fn) {
      if (isFunction(listener)) return emitter.add(listener, basePath);

      const isProj = isProjection(listener);
      const selector = isProj ?
        expandProjection(listener, basePath) :
        [...basePath, ...coerce(listener)];

      return emitter.add(fn, selector, isProj);
    },

    project: lockable(path => {
      if (!isObjectLike(path)) throw new StoreError(`project requires an object`, { value: path });
      if (isArray(path)) return api.get(path);
      
      // TODO: optimize
      const result = Object.fromEntries(
        Object.entries(path)
          .map(([key, value]) => {
            return [key, get(api.data, value)];
          })
      );

      return result;
    }),

    get: lockable(path => {
      if (!path) return api.data;
      const result = get(api.data, path);
      return result;
    }),

    exists(path) {
      if (path === undefined) return api.data !== undefined;
      return exists(api.data, coerce(path));
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