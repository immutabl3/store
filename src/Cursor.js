import signal from 'signal-js';
import Dispatcher from './Dispatcher';
import {
  get,
  solvePath,
} from './utils';
import {
  isArray,
  isString,
  isFunction,
  isObjectLike,
  isDynamicPath,
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
      return Object.fromEntries(
        Object.entries(path)
          .map(([key, value]) => {
            const startingSelector = isString(value) ? [value] : value;
            const selector = isDynamicPath(startingSelector) ? solvePath(proxy, startingSelector) : startingSelector;
            return [key, get(proxy, selector)];
          })
      );
    },
    get(path) {
      if (!path) return proxy;
      const selector = isArray(path) ? path : [path];
      return get(proxy, selector);
    },
  });
};