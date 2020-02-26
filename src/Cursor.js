import StoreError from './StoreError';
import query from './query';
import Dispatcher from './Dispatcher';
import {
  get,
} from './utils';
import {
  isArray,
  isFunction,
  isObjectLike,
} from './types';

const EMIT = Symbol('emit');

const Cursor = function(proxy, lock, schedule, path = []) {
  const dispatcher = new Dispatcher(proxy, e => this[EMIT](e), path);
  schedule.register(dispatcher);
  
  this.lock = lock;
  this.listeners = [];
  this.schedule = schedule;
  this.path = path;
  this.dispatcher = dispatcher;
  this.data = proxy;
};

Cursor.prototype = {
  [EMIT](e) {
    const listeners = this.listeners;
    for (let idx = 0; idx < listeners.length; idx++) {
      listeners[idx](e);
    }
  },

  onChange(fn) {
    this.listeners.push(fn);
    return () => {
      const { listeners } = this;
      const index = listeners.indexOf(fn);
      if (!~index) return;
      listeners.splice(index, 1);
    };
  },

  select(value) {
    const {
      schedule,
      path,
      data,
      lock,
    } = this;

    const selector = isArray(value) ? value : [value];
    
    lock.lock();
    // eslint-disable-next-line no-use-before-define
    const cursor = new Cursor(get(data, selector), lock, schedule, [...path, ...selector]);
    lock.unlock();
    
    return cursor;
  },

  watch(listener, fn) {
    const { dispatcher } = this;
    const selector = isFunction(listener) ? listener : () => listener;
    return dispatcher.watcher(selector, this, fn);
  },

  projection(path) {
    if (!isObjectLike(path)) throw new StoreError(`projection requires an object`, { value: path });
    if (isArray(path)) return this.get(path);
    const { data, lock } = this;
    
    lock.lock();
    const result = Object.fromEntries(
      Object.entries(path)
        .map(([key, value]) => {
          const selector = query.resolve(data, value);
          return [key, get(data, selector)];
        })
    );
    lock.unlock();

    return result;
  },

  get(value) {
    const { data, lock } = this;
    if (!value) return data;
    
    lock.lock();
    const selector = query.resolve(data, value);
    const result = get(data, selector);
    lock.unlock();
    
    return result;
  },
};

export default Cursor;