import signal from 'signal-js';
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

const prototype = Object.assign(Object.create(null), signal.__proto__, {
  select(value) {
    const { schedule, path, data } = this;
    const selector = isArray(value) ? value : [value];
    // eslint-disable-next-line no-use-before-define
    return Cursor(get(data, selector), schedule, [...path, ...selector]);
  },
  watch(listener, fn) {
    const { dispatcher } = this;
    const selector = isFunction(listener) ? listener : () => listener;
    return dispatcher.watcher(selector, this, fn);
  },
  projection(path) {
    if (!isObjectLike(path)) throw new StoreError(`projection requires an object`, { value: path });
    if (isArray(path)) return this.get(path);
    const { data } = this;
    return Object.fromEntries(
      Object.entries(path)
        .map(([key, value]) => {
          const selector = query.resolve(data, value);
          return [key, get(data, selector)];
        })
    );
  },
  get(value) {
    const { data } = this;
    if (!value) return data;
    const selector = query.resolve(data, value);
    return get(data, selector);
  },
});

export default function Cursor(proxy, schedule, path = []) {
  const emitter = signal();
  const dispatcher = Dispatcher(proxy, emitter, path);
  schedule.register(dispatcher);
  
  emitter.schedule = schedule;
  emitter.path = path;
  emitter.dispatcher = dispatcher;
  emitter.data = proxy;

  emitter.__proto__ = prototype;

  return emitter;
};