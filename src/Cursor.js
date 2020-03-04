import StoreError from './StoreError';
import query from './query';
import Dispatcher from './Dispatcher';
import handler from './handler';
import { get } from './utils';
import {
  isArray,
  isFunction,
  isObjectLike,
} from './types';

const Cursor = function(proxy, lock, schedule, path = []) {
  this.emitter = handler();

  const dispatcher = new Dispatcher(proxy, e => {
    const arr = this.emitter.list();
    for (let idx = 0; idx < arr.length; idx++) {
      arr[idx](e);
    }
  }, path);
  schedule.register(dispatcher);
  
  this.lock = lock;
  this.listeners = [];
  this.schedule = schedule;
  this.path = path;
  this.dispatcher = dispatcher;
  this.data = proxy;
};

Cursor.prototype = {
  onChange(fn) {
    return this.emitter.add(fn);
  },

  select(value) {
    const {
      schedule,
      path,
      data,
      lock,
    } = this;

    const selector = query.coerce(value);
    if (query.isDynamic(selector)) throw new StoreError(`select does not support dynamic paths`, { path: value });
    
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