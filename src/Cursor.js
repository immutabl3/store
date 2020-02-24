import signal from 'signal-js';
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

// TODO: performance - prototypes
export default function Cursor(proxy, schedule, path = []) {
  const emitter = signal();
  const dispatcher = Dispatcher(proxy, emitter, path);
  schedule.register(dispatcher);
  
  return Object.assign(emitter, {
    data: proxy,
    select(value) {
      const selector = isArray(value) ? value : [value];
      return Cursor(get(proxy, selector), schedule, [...path, ...selector]);
    },
    watch(listener, fn) {
      const selector = isFunction(listener) ? listener : () => listener;
      return dispatcher.watcher(selector, this, fn);
    },
    projection(path) {
      if (!isObjectLike(path)) throw new Error(`store: projection requires an object`);
      if (isArray(path)) return this.get(path);
      return Object.fromEntries(
        Object.entries(path)
          .map(([key, value]) => {
            const selector = query.resolve(proxy, value);
            return [key, get(proxy, selector)];
          })
      );
    },
    get(value) {
      if (!value) return proxy;
      const selector = query.resolve(proxy, value);
      return get(proxy, selector);
    },
  });
};