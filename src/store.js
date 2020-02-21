import signal from 'signal-js';
import proxyWatcher from './proxyWatcher';
import Dispatcher from './Dispatcher';
import Scheduler from './Scheduler';
import { isFunction } from './types';
import debug from './debug';

// TODO: performance?
const Cursor = function(proxy, schedule, path = []) {
  const emitter = signal();
  const dispatcher = Dispatcher(proxy, emitter, path);
  schedule.register(dispatcher);
  
  return Object.assign(emitter, {
    data: proxy,
    select(path) {
      // TODO: target the correct part of the object in proxy to pass to Cursor
      return Cursor(proxy, schedule, path);
    },
    watch(listener, callback) {
      const selector = isFunction(listener) ? listener : () => listener;
      dispatcher.watch(selector, callback);
      return this;
    },
    project(selector, callback) {
      dispatcher.project(selector, callback);
      return this;
    },
  });
};

export default function Store(obj, {
  // should the transactions be handled asynchronously?
  asynchronous = true,
  // should the tree handle its transactions on its own?
  autoCommit = true,
  // should we debug the changes?
  debug: shouldDebug = false,
  debugOptions = {},
} = {}) {
  const schedule = Scheduler(asynchronous, autoCommit);
  // creates a proxy and fires every time the proxy changes
  // with the changed paths
  const proxy = proxyWatcher(obj, schedule.add);
  const cursor = Cursor(proxy, schedule);
  if (shouldDebug) schedule.debug(debug(proxy, debugOptions));
  cursor.commit = schedule.commit;
  return cursor;
};