import StoreError from '../StoreError.js';
import makeMethod from './makeMethod.js';
import methodDefinitions from './methodDefinitions.js';
import {
  get,
  coerce,
} from '../query.js';
import {
  exists,
  clone,
} from '../utils/index.js';
import {
  isArray,
  isFunction,
  isObjectLike,
  isProjection,
} from '../types.js';

const expandProjection = (projection, basePath) => {
  const target = Object.create(null);
  for (const key in projection) {
    target[key] = basePath.concat(coerce(projection[key]));
  }
  return target;
};

export default class Cursor {
  constructor(root, locker, emitter, basePath = []) {
    this.root = root;
    this.locker = locker;
    this.emitter = emitter;
    this.basePath = basePath;
    this.isRoot = !basePath.length;
  }

  get data() {
    return get(this.root, this.basePath);
  }

  select(value) {
    const selector = coerce(value);
    return new Cursor(this.root, this.locker, this.emitter, [...this.basePath, ...selector]);
  }

  watch(listener, fn) {
    const { emitter, basePath } = this;
    if (isFunction(listener)) return this.emitter.add(listener, basePath);

    const isProj = isProjection(listener);
    const selector = isProj ?
      expandProjection(listener, basePath) :
      [...basePath, ...coerce(listener)];

    return emitter.add(fn, selector, isProj);
  }

  project(path) {
    // start by locking
    this.locker.lock();
    try {
      // perform work
      if (!isObjectLike(path)) throw new StoreError(`project requires an object`, { value: path });
      if (isArray(path)) return this.get(path);
      
      const result = Object.fromEntries(
        Object.entries(path)
          .map(([key, value]) => (
            [key, get(this.root, this.basePath.concat(value))]
          ))
      );

      // this will be the returned result, even
      // though we are in a try and have a finally
      return result;

      // don't catch, let the error bubble
    } finally {
      // will always unlock, even if there was an error
      // and even though we're returning above
      this.locker.unlock();
    }
  }

  get(path) {
    this.locker.lock();
    try {
      if (!path) return this.data;
      const result = get(this.data, path);
      return result;
    } finally {
      this.locker.unlock();
    }
  }

  exists(path) {
    if (path === undefined) return this.data !== undefined;
    return exists(this.data, coerce(path));
  }

  clone(path) {
    if (path === undefined) return clone(this.data);
    return clone(this.get(path));
  }

  toJSON() {
    this.locker.lock();
    try {
      return JSON.stringify(this.data);
    } finally {
      this.locker.unlock();
    }
  }
};

methodDefinitions.forEach(([name, arity, check]) => (
  makeMethod(Cursor.prototype, name, arity, check)
));